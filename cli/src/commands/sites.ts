import { Command } from "@commander-js/extra-typings";
import { getProfile } from "../lib/config";
import { program } from "../program";
import { fail, formatList, print } from "../lib/io";
import { createAuthedClient } from "../api";

export const sites = new Command()
  .name("sites")
  .description("site operations");

sites.command("list").action(async () => {
  const opts = program.opts();
  const profile = getProfile(opts.profile);
  try {
    const api = await createAuthedClient(profile);
    const page = await api.sites.list();
    print(!!opts.json, page.content, () =>
      formatList(
        page.content.map((site) => [site.slug, site.name, `v${site.currentVersion ?? "-"}`]),
        "\t",
      ),
    );
  } catch (err: any) {
    console.error(err)
    fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
  }
});
