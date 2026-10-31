import { createClient } from "@dockside/api-client";
import { clearSession, loadSessionState, saveSession, Session } from "./lib/config";

export async function createAuthedClient(profile: string) {
  const state = await loadSessionState(profile);

  if (state.status === "missing") {
    throw new Error(
      `not logged in (profile "${profile}"), run "dockside login --profile ${profile}"`,
    );
  }

  if (state.status === "corrupt") {
    throw new Error(
      `session corrupt (profile "${profile}"), run "dockside login --profile ${profile}"`,
    );
  }

  const { session } = state;

  return createClient(
    session.baseUrl,
    {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    },
    {
      onStateChange(state) {
        const baseUrl = session.baseUrl;
        const { accessToken, refreshToken } = state;
        if (accessToken == null || refreshToken == null) {
          clearSession(profile);
          return;
        }

        saveSession(profile, { baseUrl, accessToken, refreshToken });
      },
    },
  );
}
