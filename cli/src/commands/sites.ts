import { Command } from "@commander-js/extra-typings";
import { getProfile } from "../lib/config";
import { program } from "../program";
import { c, fail, formatList, healthGlyph, print, statusGlyph } from "../lib/io";
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

sites
  .command("list")
  .option("--q <query>")
  .option("--status <status>")
  .action(async (cmd) => {
    const opts = program.opts();
    if (cmd.status != null && cmd.status !== "up" && cmd.status !== "down") {
      fail(!!opts.json, "BAD_STATUS", `invalid status "${cmd.status}", use up or down`);
    }
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const page = await api.sites.list({ q: cmd.q, status: cmd.status as "up" | "down" });
    print(!!opts.json, page.content, () => {
      const rows = page.content.map((site) => [
        site.slug,
        site.name,
        healthGlyph(site.up, site.currentVersion != null),
        `v${site.currentVersion ?? "-"}`,
        c.dim(site.createdAt),
      ]);
      const header = ["slug", "name", "health", "version", "created"].map((h) => c.dim(h));
      return formatList(rows.length > 0 ? [header, ...rows] : rows, " ".repeat(4));
    });
  } catch (err: any) {
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
      print(!!opts.json, site, () => {
        const rows: unknown[][] = [
          [c.dim("name"), site.name],
          [c.dim("health"), healthGlyph(site.up, site.currentVersion != null)],
          [c.dim("version"), site.currentVersion == null ? "-" : `v${site.currentVersion}`],
          [c.dim("created"), site.createdAt],
          [c.dim("by"), site.createdByUsername ?? "-"],
        ];
        if (site.latestDeployment != null) {
          rows.push([
            c.dim("latest"),
            `v${site.latestDeployment.version} ${statusGlyph(site.latestDeployment.status)}`,
          ]);
        }
        if (site.up != null) rows.push([c.dim("checked"), site.checkedAt ?? "-"]);
        return `${c.bold(site.slug)}\n${formatList(rows, " ".repeat(2))}`;
      });
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });
