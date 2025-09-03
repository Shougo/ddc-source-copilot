import type { DdcGatherItems } from "@shougo/ddc-vim/types";
import {
  BaseSource,
  type GatherArguments,
  type OnCompleteDoneArguments,
  type OnInitArguments,
} from "@shougo/ddc-vim/source";
import { Unprintable, type UnprintableUserData } from "@milly/ddc-unprintable";
import { assert, is } from "@core/unknownutil";

import type { Denops } from "@denops/std";
import * as fn from "@denops/std/function";
import { batch } from "@denops/std/batch";
import { register } from "@denops/std/lambda";
import { delay } from "@std/async/delay";

type Suggestion = {
  displayText: string;
  position: {
    character: number;
    line: number;
  };
  range: {
    start: {
      character: number;
      line: number;
    };
    end: {
      character: number;
      line: number;
    };
  };
  insertText: string;
  uuid: string;
};

type Params = {
  copilot: "vim" | "lua";
};
type UserData = Record<string, never> & UnprintableUserData;

export class Source extends BaseSource<Params> {
  #unprintable?: Unprintable<UserData>;

  override onInit(_args: OnInitArguments<Params>) {
    this.#unprintable = new Unprintable<UserData>({
      highlightGroup: "SpecialKey",
      callbackId: `source/${this.name}`,
    });
  }

  override async gather(
    args: GatherArguments<Params>,
  ): Promise<DdcGatherItems> {
    switch (args.sourceParams.copilot) {
      case "vim": {
        if (!await fn.exists(args.denops, "*copilot#Complete")) {
          return [];
        }

        this.#tellToVim(args);
        break;
      }
      case "lua": {
        if (args.denops.meta.host !== "nvim") {
          return [];
        }

        this.#tellToLua(args);
        break;
      }
      default: {
        args.sourceParams.copilot satisfies never;
        break;
      }
    }

    return await Promise.resolve({
      items: [],
      isIncomplete: true,
    });
  }

  override params(): Params {
    // NOTE: use vim as default for compatibility
    return {
      copilot: "vim",
    };
  }

  override onCompleteDone(
    args: OnCompleteDoneArguments<Params, UserData>,
  ): Promise<void> {
    return this.#unprintable!.onCompleteDone(args);
  }

  async #tellToVim(
    args: GatherArguments<Params>,
  ): Promise<void> {
    await batch(args.denops, async (denops: Denops) => {
      await denops.call("copilot#Suggest");
      await denops.call("copilot#Next");
      await denops.call("copilot#Previous");
    });

    while (!await fn.exists(args.denops, "b:_copilot.suggestions")) {
      await delay(10);
    }

    const suggestions = await args.denops.call(
      "eval",
      "b:_copilot.suggestions",
    ) as Suggestion[];

    await this.#updateItems(args, suggestions);
  }

  async #tellToLua(
    args: GatherArguments<Params>,
  ): Promise<void> {
    const id = register(args.denops, async (suggestions: unknown) => {
      assert(suggestions, is.ArrayOf(is.ObjectOf({ text: is.String })));

      await this.#updateItems(
        args,
        suggestions.map(({ text: insertText }) => ({ insertText })),
      );
    });

    await args.denops.call(
      "luaeval",
      "require('ddc.source.copilot').update_items(_A[1], _A[2])",
      [args.denops.name, id],
    );
  }

  async #updateItems(
    args: GatherArguments<Params>,
    suggestions: Pick<Suggestion, "insertText">[],
  ): Promise<void> {
    const items = suggestions.map(({ insertText }) => {
      const match = /^(?<indent>\s*).+/.exec(insertText);
      const indent = match?.groups?.indent;

      const info = indent != null
        ? insertText.split("\n").map((line) => line.slice(indent.length))
          .join("\n")
        : insertText;

      return {
        word: insertText.slice(args.completePos),
        info,
      };
    });

    await args.denops.call(
      "ddc#update_items",
      this.name,
      await this.#unprintable!.convertItems(
        args.denops,
        items,
        args.context.nextInput,
      ),
    );
  }
}
