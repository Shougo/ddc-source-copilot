import {
  BaseSource,
  Item,
} from "https://deno.land/x/ddc_vim@v2.2.0/types.ts";
import { GatherArguments, GetCompletePositionArguments } from "https://deno.land/x/ddc_vim@v2.2.0/base/source.ts";

type Params = Record<never, never>;

export class Source extends BaseSource<Params> {
  // deno-lint-ignore require-await
  async getCompletePosition(
    args: GetCompletePositionArguments<Params>,
  ): Promise<number> {
    // From current cursor
    return Promise.resolve(args.context.input.length);
  }

  async gather(args: GatherArguments<Params>): Promise<Item[]> {
    await args.denops.call("ddc#sources#copilot#callback");
    return [];
  }

  params(): Params {
    return {};
  }
}
