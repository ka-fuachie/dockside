import { StartMiddleware } from "@solidjs/vite-plugin";
import { createAPIHandler } from "filesystem-routing/api";
import routes from "virtual:file-routes";
import { SessionRecord, SessionStore } from "./lib/server/session-store";
import { ApiClient } from "@dockside/api-client";
import { getSessionId } from "./server/session";
import { createAuthedClient, createUnauthedClient } from "./server/api";
import { paths } from "./router";

declare module "@solidjs/web" {
  interface RequestEventLocals {
    session?: SessionRecord;
    sessionStore: SessionStore;
    api: ApiClient;
  }
}

const sessionStore = new SessionStore();

const attachSessionAndApi: StartMiddleware = async (event, next) => {
  const sessionId = await getSessionId(event);
  let session: SessionRecord | null = null;

  if (sessionId != null) {
    session = sessionStore.get(sessionId);
  }

  if (session != null) {
    event.locals.session = session;
    event.locals.api = createAuthedClient(session, sessionStore);
  } else {
    event.locals.api = createUnauthedClient();
  }

  event.locals.sessionStore = sessionStore;

  return next();
};

function defineRedirects(map: Record<string, string>) {
  const middleware: StartMiddleware = async (event, next) => {
    const url = new URL(event.request.url);
    const redirectPath = Object.keys(map).find((path) =>
      path == "/" ? url.pathname == path : url.pathname.startsWith(path),
    );
    if (redirectPath != null) {
      const redirect = map[redirectPath];
      return Response.redirect(new URL(redirect, event.request.url), 302);
    }

    return next();
  };

  return middleware;
}

function protectRoutes(paths: string[], redirect: (url: URL) => string) {
  const middleware: StartMiddleware = async (event, next) => {
    const url = new URL(event.request.url);
    const isProtected = paths.some((path) => url.pathname.startsWith(path));
    if (isProtected && event.locals.session == null) {
      return Response.redirect(new URL(redirect(url), event.request.url), 302);
    }
    return next();
  };

  return middleware;
}

const apiHandler: StartMiddleware = (event, next) => createAPIHandler(routes)(event.request, next);

export default [
  attachSessionAndApi,
  defineRedirects({ "/": paths.sites() }),
  protectRoutes(["/sites"], (url) => paths.login({ next: url.pathname + url.search })),
  apiHandler,
];
