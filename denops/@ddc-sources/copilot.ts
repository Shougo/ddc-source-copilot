import { type DdcGatherItems } from "jsr:@shougo/ddc-vim@~7.0.0/types";
import {
  BaseSource,
  type GatherArguments,
  type OnCompleteDoneArguments,
} from "jsr:@shougo/ddc-vim@~7.0.0/source";

import type { Denops } from "jsr:@denops/core@~7.0.0";
import * as fn from "jsr:@denops/std@~7.1.1/function";
import { batch } from "jsr:@denops/std@~7.1.1/batch";
import { delay } from "jsr:@std/async@~1.0.4/delay";

export type CompletionMetadata = {
  word: string;
};

type Suggestion = {
  displayText: string;
  position: { character: number; line: number };
  range: {
    start: { character: number; line: number };
    end: { character: number; line: number };
  };
  insertText: string;
  uuid: string;
};

type Params = Record<string, never>;

export class Source extends BaseSource<Params> {
  override async gather(
    args: GatherArguments<Params>,
  ): Promise<DdcGatherItems> {
    if (!(await fn.exists(args.denops, "*copilot#Complete"))) {
      return [];
    }

    const f = async () => {
      await batch(args.denops, async (denops: Denops) => {
        await denops.call("copilot#Suggest");
        await denops.call("copilot#Next");
        await denops.call("copilot#Previous");
      });

      while (!(await fn.exists(args.denops, "b:_copilot.suggestions"))) {
        await delay(10);
      }

      const suggestions = await args.denops.call(
        "eval",
        "b:_copilot.suggestions",
      ) as Suggestion[];

      const items = suggestions.map(({ insertText }) => {
        const match = /^(?<indent>\s*).+/.exec(insertText);
        const indent = match?.groups?.indent;

        const info = indent != null
          ? insertText.split("\n").map((line) => line.slice(indent.length))
            .join("\n")
          : insertText;

        return {
          word: insertText.split("\n")[0].slice(args.completePos),
          info,
          user_data: {
            word: insertText,
          },
        };
      });

      await args.denops.call("ddc#update_items", this.name, items);
    };

    f();

    return await Promise.resolve({
      items: [],
      isIncomplete: true,
    });
  }

  override params() {
    return {};
  }

  override async onCompleteDone(
    args: OnCompleteDoneArguments<Params, CompletionMetadata>,
  ) {
    const firstLine = args.userData?.word.split("\n")[0];
    const currentLine = await fn.getline(args.denops, ".");
    if (currentLine !== firstLine) {
      return;
    }

    const lines = args.userData?.word.split("\n");
    if (lines === undefined || lines[1] === undefined) {
      return;
    }

    const lnum = await fn.line(args.denops, ".");
    const appendLines = lines.slice(1);
    await fn.append(args.denops, lnum, appendLines);
    await fn.setpos(args.denops, ".", [
      0,
      lnum + appendLines.length,
      appendLines.slice(-1)[0].length + 1,
      0,
    ]);
  }
}
