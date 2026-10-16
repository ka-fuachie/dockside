import { createClient } from "@dockside/api-client";
import { clearSession, loadSession, saveSession, Session } from "./lib/config";

export async function createAuthedClient(profile: string) {
  let session: Session | null;
  try {
    session = await loadSession(profile);
  } catch {
    throw new Error(
      `failed to load session (profile "${profile}"), run "dockside login --profile ${profile}"`,
    );
  }

  if (session == null) {
    throw new Error(
      `not logged in (profile "${profile}"), run "dockside login --profile ${profile}"`,
    );
  }

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
