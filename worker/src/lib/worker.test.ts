import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { zipSync } from "fflate";
import pino from "pino";
import type { ApiClient } from "@dockside/api-client";
import { Worker } from "./worker";

const enc = new TextEncoder();
const zip = (files: Record<string, string>) =>
  zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, enc.encode(v)])));

const job = { id: 1, siteId: 7, siteSlug: "demo", version: 3, status: "running", createdAt: "now" };

function harness(zipBytes: Uint8Array | null, opts?: { jobs?: unknown[] }) {
  const queue = [...(opts?.jobs ?? [job])];
  const agent = {
    nextJob: vi.fn(async () => queue.shift() ?? null),
    artifact: vi.fn(async () => zipBytes),
    result: vi.fn(async () => null),
    activate: vi.fn(async () => null),
  };
  const api = { agent } as unknown as ApiClient;
  return { agent, api };
}

async function waitFor(cond: () => boolean, timeout = 2000) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > timeout) throw new Error("timed out waiting for worker");
    await new Promise((r) => setTimeout(r, 10));
  }
}

let dirs: string[] = [];
afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  dirs = [];
  vi.unstubAllGlobals();
});

async function sitesDir() {
  const d = await mkdtemp(join(tmpdir(), "sites-"));
  dirs.push(d);
  return d;
}

describe("Worker deploy", () => {
  it("flattens publish dir, flips symlink, activates", async () => {
    const dir = await sitesDir();
    const { agent, api } = harness(
      zip({ "dockside.toml": 'publish = "dist"', "dist/index.html": "<html>" }),
    );
    const w = new Worker(api, dir, pino({ level: "silent" }), 5);
    w.start();
    await waitFor(() => agent.activate.mock.calls.length === 1);
    w.stop();

    expect(agent.activate).toHaveBeenCalledWith({ deploymentId: 1 });
    expect(agent.result).not.toHaveBeenCalled();
    expect(await readFile(join(dir, "demo", "current", "index.html"), "utf8")).toBe("<html>");
    expect(w.metrics.success).toBe(1);
  });

  it("fails the job when the entry file is missing", async () => {
    const dir = await sitesDir();
    const { agent, api } = harness(zip({ "other.txt": "x" }));
    const w = new Worker(api, dir, pino({ level: "silent" }), 5);
    w.start();
    await waitFor(() => agent.result.mock.calls.length === 1);
    w.stop();

    expect(agent.activate).not.toHaveBeenCalled();
    // @ts-expect-error
    expect(agent.result.mock.calls[0][0]).toMatchObject({ deploymentId: 1, success: false });
    // @ts-expect-error
    expect(String(agent.result.mock.calls[0][0].logs)).toContain("entry not found");
    await expect(stat(join(dir, "demo", "current"))).rejects.toThrow();
    expect(w.metrics.failure).toBe(1);
  });

  it("rejects zip-slip without writing outside sitesDir", async () => {
    const dir = await sitesDir();
    const { agent, api } = harness(zip({ "../../x": "evil", "index.html": "<html>" }));
    const w = new Worker(api, dir, pino({ level: "silent" }), 5);
    w.start();
    await waitFor(() => agent.result.mock.calls.length === 1);
    w.stop();

    // @ts-expect-error
    expect(String(agent.result.mock.calls[0][0].logs)).toContain("zip-slip");
    expect(agent.activate).not.toHaveBeenCalled();
    await expect(stat(join(tmpdir(), "x"))).rejects.toThrow();
  });

  it("fails the job on a bad publish dir", async () => {
    const dir = await sitesDir();
    const { agent, api } = harness(
      zip({ "dockside.toml": 'publish = "../evil"', "index.html": "<html>" }),
    );
    const w = new Worker(api, dir, pino({ level: "silent" }), 5);
    w.start();
    await waitFor(() => agent.result.mock.calls.length === 1);
    w.stop();

    // @ts-expect-error
    expect(String(agent.result.mock.calls[0][0].logs)).toContain("bad dockside.toml");
    expect(agent.activate).not.toHaveBeenCalled();
  });
});
