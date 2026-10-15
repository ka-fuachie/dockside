#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import { createClient } from "@dockside/api-client";
import { DEFAULT_API_URL, getApiUrl, getProfile, saveSession } from "./lib/config";
import { ask, fail, formatList, print } from "./lib/io";
import { createAuthedClient } from "./api";

const program = new Command()
  .name("dockside")
  .option("--json", "machine-readable output")
  .option("--profile <name>", "config profile", "dev")
  .addHelpText(
    "after",
    `
Environment:
  DOCKSIDE_PROFILE   default for --profile (default: "dev")
  DOCKSIDE_API       default api url at login (default: http://localhost:$API_PORT)`,
  );

program
  .command("login")
  .option("--username <u>")
  .option("--password <p>")
  .option("--api-url <url>")
  .action(async (cmd) => {
    const opts = program.opts();
    const profile = getProfile(opts.profile);
    const url = await getApiUrl(cmd.apiUrl, () => ask(`api url [${DEFAULT_API_URL}]: `, false));
    const username = cmd.username ?? (await ask("username: ", false));
    const password = cmd.password ?? (await ask("password: ", true));
    try {
      const api = createClient(url);
      const tokens = await api.auth.login({ username, password });
      await saveSession(profile, { baseUrl: url, ...tokens });
      print(!!opts.json, { ok: true, baseUrl: url }, () => `logged in to ${url}`);
    } catch (err: any) {
      fail(!!opts.json, err?.code ?? "LOGIN_FAILED", err.message);
    }
  });

const sites = program.command("sites").description("site operations");
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
    fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
  }
});

await program.parseAsync(process.argv);
