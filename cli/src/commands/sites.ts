import { Command } from "@commander-js/extra-typings";
import { getProfile } from "../lib/config";
import { program } from "../program";
import { fail, formatList, print } from "../lib/io";
import { createAuthedClient } from "../api";
import { resolveSiteId } from "../lib/utils";

const validSlugExp = /^[a-z0-9-]+$/;

export function slugify(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || null;
}

export const sites = new Command().name("sites").description("site operations");

sites.command("list").action(async () => {
  const opts = program.opts();
  const profile = getProfile(opts.profile);
  try {
    const api = await createAuthedClient(profile);
    const page = await api.sites.list();
    print(!!opts.json, page.content, () =>
      formatList(
        page.content.map((site) => [site.slug, site.name, `v${site.currentVersion ?? "-"}`]),
        " ".repeat(4),
      ),
    );
  } catch (err: any) {
    console.error(err);
    fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
  }
});

sites
  .command("create")
  .argument("<name>")
  .option("--slug <slug>")
  .action(async (name, cmd) => {
    const opts = program.opts();
    const slug = cmd.slug ?? slugify(name);
    if (slug == null) {
      fail(!!opts.json, "BAD_SLUG", `could not sluggify "${name}", pass --slug <my-slug>`);
    }
    if (!validSlugExp.test(slug)) {
      fail(
        !!opts.json,
        "BAD_SLUG",
        `invalid slug "${slug}", should be lowercase letters, numbers or hyphens`,
      );
    }

    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const site = await api.sites.create({ slug, name });
      print(!!opts.json, site, () => `created ${site.slug} (id ${site.id})`);
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });

sites
  .command("get")
  .argument("<site>")
  .action(async (ref) => {
    const opts = program.opts();
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const site = await api.sites.one({ id: await resolveSiteId(api, ref) });
      print(!!opts.json, site, () => `${site.slug}\t${site.name}\tv${site.currentVersion ?? "-"}`);
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });
