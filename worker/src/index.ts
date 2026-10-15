import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { createServer } from "./server";
import { worker } from "./worker";

const server = createServer(worker);
server.listen(env.WORKER_PORT, () => {
  logger.info({ port: env.WORKER_PORT, sites: env.SITES_DIR }, "worker starting");
  worker.start();
});

let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, "shutting down");
  worker.stop();
  server.closeIdleConnections();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
