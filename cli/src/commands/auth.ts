import { Command } from "@commander-js/extra-typings";
import { ask, fail, print } from "../lib/io";
import { program } from "../program";
import {
  DEFAULT_API_URL,
  clearSession,
  getApiUrl,
  getProfile,
  loadSessionState,
  saveSession,
} from "../lib/config";
import { decodeAccessClaims } from "../lib/jwt";
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
  const state = await loadSessionState(profile);

  if (state.status === "missing") {
    print(!!opts.json, { ok: true, alreadyLoggedOut: true }, () => `not logged in — nothing to do`);
    return;
  }

  if (state.status === "corrupt") {
    await clearSession(profile);
    print(
      !!opts.json,
      { ok: true, alreadyLoggedOut: true, removedCorruptSession: true },
      () => `removed corrupt session file (profile "${profile}")`,
    );
    return;
  }

  const { session } = state;
  try {
    const api = createClient(session.baseUrl, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    await api.auth.logout({ refreshToken: session.refreshToken });
    await clearSession(profile);
    print(
      !!opts.json,
      { ok: true, baseUrl: session.baseUrl },
      () => `logged out of ${session.baseUrl}`,
    );
  } catch (err: any) {
    fail(!!opts.json, err?.code ?? "LOGOUT_FAILED", err.message);
  }
});

export const whoami = new Command().name("whoami").action(async () => {
  const opts = program.opts();
  const profile = getProfile(opts.profile);
  const state = await loadSessionState(profile);

  if (state.status === "missing") {
    print(
      !!opts.json,
      { loggedIn: false, reason: "missing" },
      () => `not logged in (profile "${profile}"), run "dockside login --profile ${profile}"`,
    );
    return;
  }

  if (state.status === "corrupt") {
    print(
      !!opts.json,
      { loggedIn: false, reason: "corrupt" },
      () => `session corrupt (profile "${profile}"), run "dockside login --profile ${profile}"`,
    );
    return;
  }

  const { session } = state;
  const claims = decodeAccessClaims(session.accessToken);

  if (claims == null) {
    print(
      !!opts.json,
      { loggedIn: true, profile, baseUrl: session.baseUrl, username: null, role: null },
      () => `logged in to ${session.baseUrl} (identity claims unreadable)`,
    );
    return;
  }

  print(
    !!opts.json,
    { loggedIn: true, profile, baseUrl: session.baseUrl, ...claims },
    () => `${claims.username} (${claims.role}) — profile "${profile}" @ ${session.baseUrl}`,
  );
});
