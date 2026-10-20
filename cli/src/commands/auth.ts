import { Command } from "@commander-js/extra-typings";
import { ask, fail, print } from "../lib/io";
import { program } from "../program";
import { DEFAULT_API_URL, getApiUrl, getProfile, loadSession, saveSession } from "../lib/config";
import { createClient } from "@dockside/api-client";
import { createAuthedClient } from "../api";

export const login = new Command()
  .name("login")
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

export const logout = new Command().name("logout").action(async () => {
  const opts = program.opts();
  const profile = getProfile(opts.profile);
  try {
    const api = await createAuthedClient(profile);
    const session = await loadSession(profile);
    if (session == null) {
      print(
        !!opts.json,
        { ok: true, alreadyLoggedOut: true },
        () => `not logged in — nothing to do`,
      );
      return;
    }

    api.auth.logout({ refreshToken: session!.refreshToken });
    print(
      !!opts.json,
      { ok: true, baseUrl: session!.baseUrl },
      () => `logged out of ${session!.baseUrl}`,
    );
  } catch (err: any) {
    fail(!!opts.json, err?.code ?? "LOGOUT_FAILED", err.message);
  }
});
