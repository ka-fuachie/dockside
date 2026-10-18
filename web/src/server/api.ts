import "server-only";
import { createClient } from "@dockside/api-client";
import { env } from "virtual:env/server";
import { SessionStore } from "../lib/server/session-store";

export function createUnauthedClient() {
  return createClient(env.API_URL);
}

export function createAuthedClient(sessionId: string, sessionStore: SessionStore) {
  return createClient(
    env.API_URL,
    {},
    {
      onStateChange(state) {
        if (state.accessToken == null || state.refreshToken == null) {
          sessionStore.destroy(sessionId);
          return;
        }

        sessionStore.setAccessToken(sessionId, state.accessToken);
      },
    },
  );
}
