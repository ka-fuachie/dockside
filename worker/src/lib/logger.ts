import pino from "pino";
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
