import { ApiClientState } from "./client";

export type ApiRequestInit = {
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, unknown>;
};

export function makeRequest(
  baseUrl: string,
  method: string,
  path: string,
  state: ApiClientState,
  init?: ApiRequestInit,
  signal?: AbortSignal,
) {
  const url = new URL(path, baseUrl);
  const query =
    init?.query != null
      ? Object.fromEntries(
          Object.entries(init.query)
            .filter(([__, value]) => value != null)
            .map(([key, value]) => [key, String(value)]),
        )
      : undefined;
  const params = new URLSearchParams(query);
  url.search = params.toString();

  let body = init?.body;

  const headers = new Headers(init?.headers);
  if (body != null && !(body instanceof Blob || body instanceof FormData)) {
    headers.append("Content-Type", "application/json");
    body = JSON.stringify(body);
  }
  if (state.accessToken != null) {
    headers.append("Authorization", `Bearer ${state.accessToken}`);
  }
  if (state.agentToken != null) {
    headers.append("X-Agent-Token", state.agentToken);
  }

  return fetch(url, {
    method,
    headers,
    body: body as BodyInit,
    signal,
  });
}
