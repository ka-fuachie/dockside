import { Command } from "@commander-js/extra-typings";
import { program } from "../program";
import { createAuthedClient } from "../api";
import { getProfile } from "../lib/config";
import { reportIncident, resolveSiteId, tail } from "../lib/utils";
import { c, fail, formatList, print, progress, statusGlyph } from "../lib/io";

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
      print(!!opts.json, page.content, () => {
        const rows = page.content.map((d) => [
          `v${d.version}${d.version === site.currentVersion ? "(current)" : ""}`,
          `#${d.id}`,
          statusGlyph(d.status),
          d.createdByUsername ?? "-",
          c.dim(d.createdAt),
        ]);
        const header = ["version", "id", "status", "who", "created"].map((h) => c.dim(h));
        return formatList(rows.length > 0 ? [header, ...rows] : rows, " ".repeat(4));
      });
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });

deployments
  .command("logs")
  .description("incident logs for a deployment")
  .requiredOption("--site <ref>")
  .requiredOption("--version <v>")
  .action(async (cmd) => {
    const opts = program.opts();
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const siteId = await resolveSiteId(api, cmd.site);
      const version = Number(cmd.version);
      if (!Number.isInteger(version)) {
        fail(!!opts.json, "BAD_VERSION", `invalid version "${cmd.version}"`);
      }

      const page = await api.deployments.history({ siteId, size: 100 });
      const target = page.content.find((d) => d.version === version);
      if (target == null) {
        fail(!!opts.json, "VERSION_NOT_FOUND", `v${version} not found for this site`);
      }

      const incidents = await api.incidents.list({ deploymentId: target.id });
      print(!!opts.json, incidents, () => {
        if (incidents.length === 0) return `no incidents for v${version}`;
        return incidents
          .map((i) => {
            const logs = i.logs != null && i.logs.trim() !== "" ? tail(i.logs) : "no logs attached";
            return `[${i.createdAt}] ${i.reason}\n--- last logs ---\n${logs}`;
          })
          .join("\n\n");
      });
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });

export const rollback = new Command()
  .name("rollback")
  .requiredOption("--site <ref>")
  .requiredOption("--to <version>")
  .option("--wait [seconds]", "poll until the repoint finishes", "120")
  .action(async (cmd) => {
    const opts = program.opts();
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const siteId = await resolveSiteId(api, cmd.site);
      const to = Number(cmd.to);
      if (!Number.isInteger(to) || to < 1) {
        fail(!!opts.json, "BAD_VERSION", `invalid version "${cmd.to}"`);
      }

      const page = await api.deployments.history({ siteId, size: 100 });
      const target = page.content.find((d) => d.version === to);
      if (target == null) {
        const known = page.content.map((d) => `v${d.version}(${d.status})`).join(", ");
        fail(
          !!opts.json,
          "VERSION_NOT_FOUND",
          known ? `v${to} not found for this site, known: ${known}` : `site has no deployments`,
        );
      }
      if (target.status !== "success") {
        fail(
          !!opts.json,
          "NOT_ROLLBACK_ELIGIBLE",
          `v${to} is ${target.status}, only success deployments are rollback-eligible`,
        );
      }

      const site = await api.deployments.rollback({ id: target.id });
      if (cmd.wait == null) {
        print(
          !!opts.json,
          site,
          () => `rollback queued: ${site.slug} → v${to} (worker will repoint)`,
        );
        return;
      }
      progress(!!opts.json, () => `repointing ${site.slug} → v${to}…`);

      const rawWait = cmd.wait === true ? 120 : cmd.wait;
      const timeout = Number(rawWait);
      if (!Number.isInteger(timeout) || timeout < 1) {
        fail(!!opts.json, "BAD_WAIT", `invalid --wait value "${rawWait}"`);
      }
      const deadline = Date.now() + timeout * 1000;
      const startedAt = Date.now();
      let lastBeat = startedAt;
      let status: string = target.status;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000));
        const history = await api.deployments.history({ siteId, size: 100 });
        const current = history.content.find((d) => d.id === target.id);
        if (current == null) break;
        status = current.status;
        if (status !== "running") break;

        const now = Date.now();
        if (now - lastBeat >= 15_000) {
          lastBeat = now;
          progress(
            !!opts.json,
            () => `repointing ${site.slug} → v${to}… ${Math.round((now - startedAt) / 1000)}s`,
          );
        }
      }

      if (status === "running") {
        fail(
          !!opts.json,
          "WAIT_TIMEOUT",
          `rollback still running after ${timeout}s, check "dockside deployments list --site ${cmd.site}"`,
        );
      }
      if (status === "success") {
        print(
          !!opts.json,
          { ok: true, site: site.slug, version: to },
          () => `${c.green("✓")} rolled back: ${site.slug} → v${to}`,
        );
        return;
      }

      const incident = await reportIncident(api, target.id, !!opts.json);
      const reason = incident?.reason ?? "unknown reason";
      fail(!!opts.json, "ROLLBACK_FAILED", `rollback to v${to} failed: ${reason}`);
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });
