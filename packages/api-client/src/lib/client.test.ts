import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "./client";
import { ApiError } from "./error";

type SeenRequest = {
  url: string;
  method: string;
  headers: Headers;
  body: unknown;
  signal: AbortSignal | null | undefined;
};

let seen: SeenRequest[] = [];
let responder: (seen: SeenRequest[], call: SeenRequest) => Response = () =>
  new Response(JSON.stringify({}), { status: 500 });

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status });
}

function stubFetch() {
  seen = [];
  vi.stubGlobal("fetch", async (url: unknown, init?: RequestInit) => {
    const call: SeenRequest = {
      url: String(url),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: init?.body,
      signal: init?.signal,
    };
    seen.push(call);
    return responder(seen, call);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const tokens = { accessToken: "a1", refreshToken: "r1" };
const site = {
  id: 1,
  slug: "demo",
  name: "Demo",
  currentVersion: null,
  createdAt: "now",
  up: null,
  checkedAt: null,
};
const error = (code: string, status: number) => json({ code, message: code }, status);

describe("auth", () => {
  it("posts credentials as json and stores tokens", async () => {
    responder = () => json(tokens);
    stubFetch();
    const states: unknown[] = [];
    const client = createClient("http://api", {}, { onStateChange: (s) => states.push({ ...s }) });
    const out = await client.auth.login({ username: "u", password: "p" });
    expect(out).toEqual(tokens);
    expect(seen).toHaveLength(1);
    expect(seen[0].headers.get("content-type")).toBe("application/json");
    expect(JSON.parse(seen[0].body as string)).toEqual({ username: "u", password: "p" });
    expect(states).toEqual([{ accessToken: "a1", refreshToken: "r1" }]);
  });

  it("emits a snapshot that cannot tamper with internals", async () => {
    responder = (calls) => (calls.length === 1 ? json(tokens) : json(site));
    stubFetch();
    let snap: Record<string, string | undefined> = {};
    const client = createClient("http://api", {}, { onStateChange: (s) => (snap = { ...s }) });
    await client.auth.login({ username: "u", password: "p" });
    snap.accessToken = "forged";
    await client.sites.one({ id: 1 });
    expect(seen[1].headers.get("authorization")).toBe("Bearer a1");
  });
});

describe("auto refresh", () => {
  it("refreshes once and retries with the new token and original signal", async () => {
    responder = (calls) => {
      const call = calls[calls.length - 1];
      if (call.url.endsWith("/auth/refresh"))
        return json({ accessToken: "a2", refreshToken: "r2" });
      if (calls.filter((c) => !c.url.endsWith("/auth/refresh")).length === 1)
        return error("UNAUTHORIZED", 401);
      return json(site);
    };
    stubFetch();
    const errors: unknown[] = [];
    const states: unknown[] = [];
    const client = createClient(
      "http://api",
      { refreshToken: "old-r" },
      { onError: (e) => errors.push(e), onStateChange: (s) => states.push({ ...s }) },
    );
    const signal = new AbortController().signal;
    const out = await client.sites.one({ id: 1 }, { signal });
    expect(out).toEqual(site);
    expect(seen.filter((c) => c.url.endsWith("/auth/refresh"))).toHaveLength(1);
    expect(JSON.parse(seen[1].body as string)).toEqual({ refreshToken: "old-r" });
    expect(seen[2].headers.get("authorization")).toBe("Bearer a2");
    expect(seen[2].signal).toBe(signal);
    expect(errors).toHaveLength(0);
    expect(states).toEqual([{ accessToken: "a2", refreshToken: "r2" }]);
  });

  it("does not refresh on bad credentials and reports once", async () => {
    responder = () => error("BAD_CREDENTIALS", 401);
    stubFetch();
    const errors: string[] = [];
    const client = createClient(
      "http://api",
      { refreshToken: "stale" },
      { onError: (e) => errors.push((e as ApiError).code) },
    );
    await expect(client.auth.login({ username: "u", password: "wrong" })).rejects.toMatchObject({
      status: 401,
      code: "BAD_CREDENTIALS",
    });
    expect(seen).toHaveLength(1);
    expect(errors).toEqual(["BAD_CREDENTIALS"]);
  });

  it("reports the original error once when refresh fails", async () => {
    responder = (calls) =>
      calls[calls.length - 1].url.endsWith("/auth/refresh")
        ? error("UNAUTHORIZED", 401)
        : error("UNAUTHORIZED", 401);
    stubFetch();
    const errors: string[] = [];
    const client = createClient(
      "http://api",
      { refreshToken: "stale" },
      { onError: (e) => errors.push((e as ApiError).code) },
    );
    await expect(client.sites.one({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(seen).toHaveLength(2);
    expect(errors).toEqual(["UNAUTHORIZED"]);
  });

  it("never refreshes agent calls", async () => {
    responder = () => error("UNAUTHORIZED", 401);
    stubFetch();
    const client = createClient("http://api", { agentToken: "tok" });
    await expect(client.agent.nextJob()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(seen).toHaveLength(1);
  });
});

describe("transport", () => {
  it("resolves empty next-job to null without reporting", async () => {
    responder = () => new Response(null, { status: 204 });
    stubFetch();
    const errors: unknown[] = [];
    const client = createClient(
      "http://api",
      { agentToken: "tok" },
      { onError: (e) => errors.push(e) },
    );
    await expect(client.agent.nextJob()).resolves.toBeNull();
    expect(errors).toHaveLength(0);
  });

  it("drops undefined query values", async () => {
    responder = () => json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
    stubFetch();
    const client = createClient("http://api", {});
    await client.sites.list({});
    expect(seen[0].url).toBe("http://api/sites");
    await client.sites.list({ page: 0, size: 10 });
    expect(seen[1].url).toBe("http://api/sites?page=0&size=10");
  });

  it("uploads without a manual content type", async () => {
    responder = () =>
      json({
        id: 7,
        siteId: 1,
        siteSlug: "demo",
        version: 1,
        status: "running",
        createdAt: "now",
        up: null,
        cheackedAt: null,
      });
    stubFetch();
    const client = createClient("http://api", {});
    const file = new Blob(["<html></html>"], { type: "text/html" });
    await client.deployments.upload({ siteId: 1, file });
    expect(seen[0].headers.get("content-type")).toBeNull();
    expect(seen[0].body).toBeInstanceOf(FormData);
  });

  it("returns bytes instead of json for artifacts", async () => {
    responder = () =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "application/zip" },
      });
    stubFetch();
    const client = createClient("http://api", { agentToken: "tok" });
    const bytes = await client.agent.artifact({ deploymentId: 5 });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(seen[0].url).toBe("http://api/agent/deployments/5/artifact");
  });
});
