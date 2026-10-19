import { defineConfig } from "tsdown";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

export default defineConfig({
  entry: ["./src/index.ts"],
  deps: {
    alwaysBundle: [/^@dockside\//],
  },
  env: Object.fromEntries(
    Object.entries({
      API_URL: process.env.API_URL,
      AGENT_TOKEN: process.env.AGENT_TOKEN,
      WORKER_PORT: process.env.WORKER_PORT,
      SITES_DIR: process.env.SITES_DIR,
      SITES_BASE_URL: process.env.SITES_BASE_URL,
      WORKER_LOG_LEVEL: process.env.WORKER_LOG_LEVEL,
    }).filter(([__, value]) => value != null),
  ),
});
