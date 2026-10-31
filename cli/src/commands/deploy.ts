import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "@commander-js/extra-typings";
import { zipSync } from "fflate";
import { program } from "../program";
import { createAuthedClient } from "../api";
import { getProfile } from "../lib/config";
import { reportIncident, resolveSiteId } from "../lib/utils";
import { fail, print, progress, statusGlyph } from "../lib/io";
import { ApiClient, ApiError } from "@dockside/api-client";

async function zipDir(dir: string): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  async function walk(d: string) {
    for (const e of await fs.readdir(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile())
        files[path.relative(dir, full).replace(/\\/g, "/")] = await fs.readFile(full);
    }
  }
  await walk(dir);
  return new Blob([zipSync(files)], { type: "application/zip" });
}

async function toUploadBlob(input: string): Promise<{ file: Blob; source: string }> {
  const st = await fs.stat(input);
  if (st.isDirectory()) return { file: await zipDir(input), source: "dir" };
  const raw = await fs.readFile(input);
  if (input.endsWith(".zip")) {
    if (raw[0] !== 0x50 || raw[1] !== 0x4b) throw new Error(`not a zip: ${input}`);
    return { file: new Blob([raw], { type: "application/zip" }), source: "zip" };
  }
  if (/\.(html?)$/i.test(input)) {
    return {
      file: new Blob([zipSync({ "index.html": raw })], { type: "application/zip" }),
      source: "file",
    };
  }

  throw new Error(`cannot deploy ${input}: single files must be .html or .zip`);
}

const MAX_POLLING_DURATION = 120_000;
const MIN_POLLING_DELAY = 2000;

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function pollDeployment(
  api: ApiClient,
  siteId: number,
  id: number,
  version: number,
  asJson: boolean,
) {
  const signal = AbortSignal.timeout(MAX_POLLING_DURATION);
  const startedAt = Date.now();
  let lastBeat = startedAt;

  while (true) {
    try {
      await wait(MIN_POLLING_DELAY);
      const page = await api.deployments.history({ siteId }, { signal });
      const found = page.content.find((d: any) => d.id === id);
      if (found && found.status !== "running") return found;

      const now = Date.now();
      if (now - lastBeat >= 15_000) {
        lastBeat = now;
        progress(asJson, () => `v${version} (#${id}) still running… ${Math.round((now - startedAt) / 1000)}s`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new Error(`timed out waiting for v${version} (#${id})`);
      }

      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403 || err.status === 404)
      ) {
        throw err;
      }
    }
  }
}

export const deploy = new Command()
  .name("deploy")
  .argument("<path>")
  .requiredOption("--site <slug>")
  .option("--no-wait", "return immediately after upload")
  .action(async (input, cmd) => {
    const opts = program.opts();
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const siteId = await resolveSiteId(api, cmd.site);
      const packed = await toUploadBlob(input);
      const dep = await api.deployments.upload({ siteId, file: packed.file });
      if (!cmd.wait) {
        return print(
          !!opts.json,
          { ...dep, packedFrom: packed.source },
          () => `packed ${packed.source}, uploaded v${dep.version} (#${dep.id}) — running`,
        );
      }

      const done = await pollDeployment(api, siteId, dep.id, dep.version, !!opts.json);
      if (done.status === "success") {
        print(!!opts.json, done, () => `v${done.version}: ${statusGlyph(done.status)}`);
        return;
      }

      const incident = await reportIncident(api, dep.id, !!opts.json);
      print(
        !!opts.json,
        { ...done, ...incident },
        () => `v${done.version}: ${statusGlyph(done.status)}`,
      );
      process.exit(1);
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });
