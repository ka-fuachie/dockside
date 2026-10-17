import { api } from "./lib/api";
import { env } from "./lib/env";
import { HealthChecker } from "./lib/health";
import { logger } from "./lib/logger";

export const healthChecker = new HealthChecker(api, env.SITES_BASE_URL, logger);
