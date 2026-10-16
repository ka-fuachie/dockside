import fs from "node:fs/promises";
import path from "node:path";
import { ApiClient, ApiError } from "@dockside/api-client";
import { Logger } from "pino";
import { unzipSync } from "fflate";
import { DEPLOYMENT_CONFIG_FILE, parseDeploymentConfig } from "@dockside/deployment-config";
import { wait } from "./utils";
import { Counter, Gauge, Registry } from "prom-client";

type Metrics = {
  success: number;
  failure: number;
  lastTick: number;
};

const DEFAULT_MIN_DELAY_MS = 10_000;
const TAIL = 4096;

export class Worker {
  #abortController: AbortController | null;
  #api: ApiClient;
  #sitesDir: string;
  #baseLogger: Logger;
  #minDelayMs: number;

  #metrics: Registry;
  #deploySuccess: Counter;
  #deployFailure: Counter;
  #lastTick: Gauge;

  constructor(api: ApiClient, sitesDir: string, baseLogger: Logger, minDelayMs?: number) {
    this.#abortController = null;
    this.#api = api;
    this.#sitesDir = sitesDir;
    this.#baseLogger = baseLogger;
    this.#minDelayMs = minDelayMs ?? DEFAULT_MIN_DELAY_MS;

    this.#metrics = new Registry();
    this.#deploySuccess = new Counter({
      name: "dockside_deploy_success_total",
      help: "Successful deploys",
      registers: [this.#metrics],
    });
    this.#deployFailure = new Counter({
      name: "dockside_deploy_failure_total",
      help: "Failed deploys",
      registers: [this.#metrics],
    });
    this.#lastTick = new Gauge({
      name: "dockside_worker_last_tick_ms",
      help: "Last tick epoch ms",
      registers: [this.#metrics],
    });
  }

  get metrics() {
    return this.#metrics;
  }

  start() {
    if (this.#abortController != null) return;
    this.#abortController = new AbortController();
    const signal = this.#abortController.signal;
    this.#tick(signal);
  }

  async #tick(signal: AbortSignal) {
    let isUnauthorized = false;
    await Promise.allSettled([
      this.#run(signal)
        .catch((err) => {
          this.#baseLogger.error((err as Error).message);
          isUnauthorized = err instanceof ApiError && err.status === 401;
        })
        .finally(() => {
          this.#lastTick.set(Date.now());
        }),
      wait(this.#minDelayMs),
    ]);

    if (signal.aborted) {
      return;
    }

    if (isUnauthorized) {
      this.stop();
      return;
    }

    await this.#tick(signal);
  }

  async #run(signal: AbortSignal) {
    const job = await this.#api.agent.nextJob(undefined, { signal });
    if (job == null) return;

    const { id, siteSlug, version } = job;
    const logger = this.#baseLogger.child({ id, site: siteSlug, version });
    const lines = [`job ${id} site=${siteSlug} v${version}`];

    try {
      logger.info("claimed job");
      const bytes = await this.#api.agent.artifact({ deploymentId: id }, { signal });
      const stagingDir = path.join(this.#sitesDir, siteSlug, `${version}.tmp`);
      const finalDir = path.join(this.#sitesDir, siteSlug, version.toString());

      await this.#initStagingDir(stagingDir);
      const deploymentConfig = await this.#unpackArtifactIntoStagingDir(bytes, stagingDir);

      let publish = ".";
      try {
        const parsed = parseDeploymentConfig(deploymentConfig);
        publish = parsed.publish;
        for (const w of parsed.warnings) {
          lines.push(`WARN: ${w}`);
          logger.warn({ warning: w }, "config warning");
        }
      } catch (err) {
        throw new Error(`bad ${DEPLOYMENT_CONFIG_FILE}: ${(err as Error).message}`);
      }

      try {
        const st = await fs.stat(path.join(stagingDir, publish, "index.html"));
        if (!st.isFile()) throw new Error("not a file");
      } catch {
        throw new Error(`entry not found: ${path.posix.join(publish, "index.html")}`);
      }

      await this.#commitPublishDir(stagingDir, publish, finalDir);

      const current = path.join(this.#sitesDir, siteSlug, "current");
      const tmpLink = path.join(this.#sitesDir, siteSlug, "current.tmp");
      await fs.rm(tmpLink, { force: true });
      await fs.symlink(version.toString(), tmpLink);
      await fs.rename(tmpLink, current);

      lines.push(`published v${version} publish=${publish}`);
      logger.info({ publish }, "published");
      this.#deploySuccess.inc();
      await this.#api.agent.activate({ deploymentId: id });
      logger.info("activated");
    } catch (err) {
      if ((err as Error).name == "AbortError") {
        logger.warn((err as Error).message);
        return;
      }

      const message = (err as Error).message;
      lines.push(`FAIL: ${message}`);
      logger.error({ err: message }, "deploy failed");
      this.#deployFailure.inc();
      await this.#api.agent.result({
        deploymentId: id,
        success: false,
        logs: lines.join("\n").slice(-TAIL),
      });
    }
  }

  async #initStagingDir(stagingDir: string) {
    await fs.rm(stagingDir, { recursive: true, force: true });
    await fs.mkdir(stagingDir, { recursive: true });
  }

  async #unpackArtifactIntoStagingDir(bytes: Uint8Array<ArrayBuffer>, stagingDir: string) {
    const entries = unzipSync(bytes);
    let deploymentConfig: string | null = null;
    for (const [raw, data] of Object.entries(entries)) {
      const name = raw.replace(/\\/g, "/");
      if (name.startsWith("/") || name.split("/").includes("..") || name.includes("\0")) {
        throw new Error(`zip-slip rejected: ${JSON.stringify(raw)}`);
      }
      if (name.endsWith("/")) continue;

      const dest = path.join(stagingDir, name);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, data);
      if (name === DEPLOYMENT_CONFIG_FILE) deploymentConfig = Buffer.from(data).toString("utf8");
    }

    return deploymentConfig;
  }

  async #commitPublishDir(stagingDir: string, publish: string, finalDir: string) {
    await fs.rm(finalDir, { recursive: true, force: true });
    const src = publish === "." ? stagingDir : path.join(stagingDir, publish);
    await fs.rename(src, finalDir);
    await fs.rm(stagingDir, { recursive: true, force: true });
  }

  stop() {
    if (this.#abortController == null) return;
    this.#abortController.abort("worker stopped");
    this.#abortController = null;
  }
}
