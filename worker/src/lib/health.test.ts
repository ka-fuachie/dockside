import { afterEach, describe, expect, it, vi } from "vitest";
import pino from "pino";
import type { ApiClient } from "@dockside/api-client";
import { HealthChecker } from "./health";

function stubFetch(responder: () => Response) {
  vi.stubGlobal("fetch", async () => responder());
}

const html = (body: string, status = 200) => new Response(body, { status });

function harness(opts?: {
  sites?: Array<{ id: number; slug: string }>;
  healthImpl?: (args: unknown) => Promise<unknown>;
}) {
  const agent = {
    sites: vi.fn(async () => opts?.sites ?? [{ id: 7, slug: "demo" }]),
    health: vi.fn(opts?.healthImpl ?? (async () => null)),
  };
  const api = { agent } as unknown as ApiClient;
  return { agent, api };
}

async function waitFor(cond: () => boolean, timeout = 2000) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > timeout) throw new Error("timed out waiting for health checker");
    await new Promise((r) => setTimeout(r, 10));
  }
}

const gauge = async (checker: HealthChecker, name: string, slug: string) => {
  const m = checker.metrics.getSingleMetric(name) as unknown as {
    get(): Promise<{ values: Array<{ labels: Record<string, string>; value: number }> }>;
  };
  return (await m.get()).values.find((v) => v.labels.slug === slug)?.value;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HealthChecker", () => {
  it("reports up with latency and bytes", async () => {
    stubFetch(() => html("<html>hi</html>", 200));
    const { agent, api } = harness();
    const c = new HealthChecker(api, "http://sites.test", pino({ level: "silent" }), 5);
    c.start();
    await waitFor(() => agent.health.mock.calls.length >= 1);
    c.stop();

    expect(agent.health.mock.calls[0][0]).toMatchObject({ siteId: 7, up: true });
    expect(await gauge(c, "dockside_site_up", "demo")).toBe(1);
    expect(await gauge(c, "dockside_site_latency_ms", "demo")).toEqual(expect.any(Number));
  });

  it("reports down on non-html body", async () => {
    stubFetch(() => html("just text", 200));
    const { agent, api } = harness();
    const c = new HealthChecker(api, "http://sites.test", pino({ level: "silent" }), 5);
    c.start();
    await waitFor(() => agent.health.mock.calls.length >= 1);
    c.stop();

    expect(agent.health.mock.calls[0][0]).toMatchObject({ siteId: 7, up: false });
    expect(await gauge(c, "dockside_site_up", "demo")).toBe(0);
  });

  it("reports down when the fetch throws, without starving siblings", async () => {
    stubFetch(() => {
      throw new Error("conn refused");
    });
    const { agent, api } = harness({
      sites: [
        { id: 7, slug: "demo" },
        { id: 8, slug: "blog" },
      ],
    });
    const c = new HealthChecker(api, "http://sites.test", pino({ level: "silent" }), 5);
    c.start();
    await waitFor(() => agent.health.mock.calls.length >= 2);
    c.stop();

    expect(await gauge(c, "dockside_site_up", "demo")).toBe(0);
    expect(await gauge(c, "dockside_site_up", "blog")).toBe(0);
  });

  it("does not fabricate rows when the report itself fails", async () => {
    stubFetch(() => html("<html>hi</html>", 200));
    const { agent, api } = harness({
      healthImpl: async () => {
        throw new Error("api down");
      },
    });
    const c = new HealthChecker(api, "http://sites.test", pino({ level: "silent" }), 5);
    c.start();
    await new Promise((r) => setTimeout(r, 100));
    c.stop();

    expect(agent.health.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(await gauge(c, "dockside_site_up", "demo")).toBe(1);
    expect(await gauge(c, "dockside_site_latency_ms", "demo")).toEqual(expect.any(Number));
  });
});
