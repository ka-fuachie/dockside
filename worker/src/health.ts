import { api, apiBaseUrl } from "./lib/api";
import { HealthChecker } from "./lib/health";
import { logger } from "./lib/logger";

export const healthChecker = new HealthChecker(api, apiBaseUrl, logger);
