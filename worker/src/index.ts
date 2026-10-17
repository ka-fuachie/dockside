import { healthChecker } from "./health";
import { env } from "./lib/env";
import { httpLogger, logger } from "./lib/logger";
import { createServer } from "./server";
import { worker } from "./worker";

const server = createServer(worker, healthChecker, httpLogger);
server.listen(env.WORKER_PORT, () => {
  logger.info(
    { port: env.WORKER_PORT, sites: env.SITES_DIR },
    "worker and health checker starting",
  );
  worker.start();
  healthChecker.start();
});

let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, "shutting down");
  worker.stop();
  healthChecker.stop();
  server.closeIdleConnections();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
