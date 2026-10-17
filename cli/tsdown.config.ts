import { defineConfig } from "tsdown";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

export default defineConfig({
  entry: ["./src/index.ts"],
  deps: {
    alwaysBundle: [/^@dockside\//],
  },
  env: {
    API_URL: process.env.API_URL,
  },
});
