import { BaseSource, Item } from "https://deno.land/x/ddc_vim@v3.4.0/types.ts";
import {
  GatherArguments,
  GetCompletePositionArguments,
} from "https://deno.land/x/ddc_vim@v3.4.0/base/source.ts";
import { fn } from "https://deno.land/x/ddc_vim@v3.4.0/deps.ts";

type Params = Record<never, never>;

export class Source extends BaseSource<Params> {
  // deno-lint-ignore require-await
  override async getCompletePosition(
    args: GetCompletePositionArguments<Params>,
  ): Promise<number> {
    // From current cursor
    return Promise.resolve(args.context.input.length);
  }

  override async gather(args: GatherArguments<Params>): Promise<Item[]> {
    if (await fn.exists(args.denops, "*copilot#Complete")) {
      await args.denops.call("ddc#sources#copilot#callback");
    }
    return [];
  }

  override params(): Params {
    return {};
  }
}
