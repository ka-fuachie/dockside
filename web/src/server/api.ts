import "server-only";
import { createClient } from "@dockside/api-client";
import { env } from "virtual:env/server";
import { SessionRecord, SessionStore } from "../lib/server/session-store";

export function createUnauthedClient() {
  return createClient(env.API_URL);
}

export function createAuthedClient(session: SessionRecord, sessionStore: SessionStore) {
  return createClient(
    env.API_URL,
    { accessToken: session.accessToken, refreshToken: session.refreshToken },
    {
      onStateChange(state) {
        if (state.accessToken == null || state.refreshToken == null) {
          sessionStore.destroy(session.id).catch(console.error);
          return;
        }

        sessionStore
          .setTokens(session.id, state.accessToken, state.refreshToken)
          .catch(console.error);
      },
    },
  );
}
