import http from "node:http";
import { Worker } from "./lib/worker";

function metric(label: string, description: string, type: string, value: string) {
  return `# HELP ${label} ${description}\n` + `# TYPE ${label} ${type}\n` + `${label} ${value}\n`;
}

export function createServer(worker: Worker) {
  return http.createServer((req, res) => {
    if (req.url == "/healthz") {
      res.writeHead(200, { "content-type": "text/plain" }).end("ok");
      return;
    }

    if (req.url == "/metrics") {
      const body = [
        metric(
          "dockside_deploy_success_total",
          "Successful deploys",
          "counter",
          worker.metrics.success.toString(),
        ),
        metric(
          "dockside_deploy_failure_total",
          "Failed deploys",
          "counter",
          worker.metrics.failure.toString(),
        ),
        metric(
          "dockside_worker_last_tick_ms",
          "Last tick epoch ms",
          "gauge",
          worker.metrics.lastTick.toString(),
        ),
      ].join("\n");
      res.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" }).end(body);
      return;
    }

    res.writeHead(404).end();
  });
}
