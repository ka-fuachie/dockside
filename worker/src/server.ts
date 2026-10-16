import http from "node:http";
import { Worker } from "./lib/worker";
import { HealthChecker } from "./lib/health";
import { Registry } from "prom-client";

export function createServer(worker: Worker, healthChecker: HealthChecker) {
  return http.createServer(async (req, res) => {
    if (req.url == "/healthz") {
      res.writeHead(200, { "content-type": "text/plain" }).end("ok");
      return;
    }

    if (req.url == "/metrics") {
      try {
        const mergedRegistry = Registry.merge([worker.metrics, healthChecker.metrics]);
        res.writeHead(200, { "Content-Type": mergedRegistry.contentType });
        res.end(await mergedRegistry.metrics());
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Error generating metrics: ${(err as Error).message}`);
      }
      return;
    }

    res.writeHead(404).end();
  });
}
