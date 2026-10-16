import { ApiClient, ApiError } from "@dockside/api-client";
import { Logger } from "pino";
import { wait } from "./utils";
import { Gauge, Registry } from "prom-client";

type HealthMetrics = {
  up: Record<string, number>;
  latencyMs: Record<string, number>;
};

const DEFAULT_MIN_DELAY_MS = 30_000;
const CHECK_TIMEOUT_MS = 5000;

export class HealthChecker {
  #abortController: AbortController | null;
  #api: ApiClient;
  #sitesBase: string;
  #baseLogger: Logger;
  #minDelayMs: number;

  #metrics: Registry;
  #siteUp: Gauge;
  #siteLatency: Gauge;

  constructor(api: ApiClient, sitesBase: string, baseLogger: Logger, minDelayMs?: number) {
    this.#abortController = null;
    this.#api = api;
    this.#sitesBase = sitesBase;
    this.#baseLogger = baseLogger;
    this.#minDelayMs = minDelayMs ?? DEFAULT_MIN_DELAY_MS;

    this.#metrics = new Registry();
    this.#siteUp = new Gauge({
      name: "dockside_site_up",
      help: "1 = serving",
      labelNames: ["slug"],
      registers: [this.#metrics],
    });
    this.#siteLatency = new Gauge({
      name: "dockside_site_latency_ms",
      help: "Check latency in ms",
      labelNames: ["slug"],
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
    try {
      await this.#run(signal);
    } catch (err) {
      this.#baseLogger.error((err as Error).message);
      if (err instanceof ApiError && err.status === 401) {
        this.stop();
        return;
      }
    }

    if (signal.aborted) {
      return;
    }

    await wait(this.#minDelayMs);
    await this.#tick(signal);
  }

  async #run(signal: AbortSignal) {
    const sites = await this.#api.agent.sites(undefined, { signal });

    await Promise.all(
      sites.map(async ({ id, slug }) => {
        const log = this.#baseLogger.child({ site: slug });
        const start = Date.now();
        try {
          const checkSignal = AbortSignal.any([signal, AbortSignal.timeout(CHECK_TIMEOUT_MS)]);
          const siteUrl = new URL(`sites/${slug}/`, this.#sitesBase);
          const res = await fetch(siteUrl, { signal: checkSignal });
          const body = await res.text();
          const ok = res.status === 200 && body.includes("<html");
          const latency = Date.now() - start;

          this.#siteUp.labels(slug).set(ok ? 1 : 0);
          this.#siteLatency.labels(slug).set(latency);
          try {
            await this.#api.agent.health({
              siteId: id,
              up: ok,
              latencyMs: latency,
              bytes: body.length,
            });
          } catch (err) {
            log.error({ err: (err as Error).message }, "health report failed");
          }

          if (!ok) log.warn({ status: res.status }, "site down");
        } catch (err) {
          const latency = Date.now() - start;
          this.#siteUp.labels(slug).set(0);
          this.#siteLatency.labels(slug).set(latency);
          log.warn({ err: (err as Error).message }, "health check failed");

          try {
            await this.#api.agent.health({ siteId: id, up: false, latencyMs: latency, bytes: 0 });
          } catch (err) {
            log.error({ err: (err as Error).message }, "health report failed");
          }
        }
      }),
    );
  }

  stop() {
    if (this.#abortController == null) return;
    this.#abortController.abort("health checker stopped");
    this.#abortController = null;
  }
}
