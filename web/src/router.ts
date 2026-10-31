import { pageRoutes } from "virtual:file-routes";
import { createRouter } from "@solidjs/router";
import { fileRoutes } from "@solidjs/router/fs";
import { env } from "virtual:env/client";

// Must match vite.config.ts `base` (prod: /app, dev: /).
const basepath = env.VITE_BASE_PATH.replace(/\/+$/, "");

export const Router = createRouter({ routes: fileRoutes(pageRoutes), base: basepath });

export const { paths } = Router;
