import {
  BaseSource,
  GatherArguments,
  OnCompleteDoneArguments,
} from "https://deno.land/x/ddc_vim@v3.4.0/base/source.ts";
import { DdcGatherItems } from "https://deno.land/x/ddc_vim@v3.4.0/types.ts";
import { batch, Denops, fn } from "https://deno.land/x/ddc_vim@v3.4.0/deps.ts";
import { delay } from "https://deno.land/std@0.186.0/async/delay.ts";

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
  text: string;
  uuid: string;
};

type Params = Record<string, never>;

export class Source extends BaseSource<Params> {
  async gather(
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

      const items = suggestions.map(({ text }) => {
        const match = /^(?<indent>\s*).+/.exec(text);
        const indent = match?.groups?.indent;

        const info = indent != null
          ? text.split("\n").map((line) => line.slice(indent.length)).join("\n")
          : text;

        return {
          word: text.split("\n")[0].slice(args.completePos),
          info,
          user_data: {
            word: text,
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

  params() {
    return {};
  }

  async onCompleteDone(
    args: OnCompleteDoneArguments<Params, CompletionMetadata>,
  ) {
    const firstLine = args.userData?.word.split("\n")[0];
    const currentLine = await fn.getline(args.denops, ".");
    if (currentLine !== firstLine) {
      return;
    }

    const lines = args.userData?.word.split("\n");
    if (lines === null || lines[1] === null) {
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
