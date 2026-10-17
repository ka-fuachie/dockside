import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "./env";

const isDev = env.NODE_ENV !== "production";

export const logger = pino({
  level: env.WORKER_LOG_LEVEL ?? "info",
  ...(isDev
    ? {
        transport: { target: "pino-pretty", options: { colorize: true, singleLine: true } },
      }
    : {}),
});

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || err) {
      return "error";
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return "silent";
    }
    return "info";
  },
});
