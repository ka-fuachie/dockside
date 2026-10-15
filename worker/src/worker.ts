import { api } from "./lib/api";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { Worker } from "./lib/worker";

export const worker = new Worker(api, env.SITES_DIR, logger);
