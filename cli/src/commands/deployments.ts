import { Command } from "@commander-js/extra-typings";
import { program } from "../program";
import { createAuthedClient } from "../api";
import { getProfile } from "../lib/config";
import { resolveSiteId } from "../lib/utils";
import { fail, formatList, print } from "../lib/io";

export const deployments = new Command().name("deployments").description("deployment operations");

deployments
  .command("list")
  .requiredOption("--site <slug>")
  .action(async (cmd) => {
    const opts = program.opts();
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const siteId = await resolveSiteId(api, cmd.site);
      const [site, page] = await Promise.all([
        api.sites.one({ id: siteId }),
        api.deployments.history({ siteId }),
      ]);
      print(!!opts.json, page.content, () =>
        formatList(
          page.content.map((d) => [
            `v${d.version}${d.version === site.currentVersion ? "(current)" : ""}`,
            d.status,
            d.createdAt,
          ]),
          " ".repeat(4),
        ),
      );
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });

export const rollback = new Command()
  .name("rollback")
  .requiredOption("--to <deploymentId>")
  .action(async (cmd) => {
    const opts = program.opts();
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const site = await api.deployments.rollback({ id: Number(cmd.to) });
      print(!!opts.json, site, () => `${site.slug} now at v${site.currentVersion}`);
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });
