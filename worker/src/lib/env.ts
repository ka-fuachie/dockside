import dotenv from "dotenv";
import * as z from "zod";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  AGENT_TOKEN: z.string(),
  API_PORT: z.coerce.number(),
  WORKER_PORT: z.coerce.number(),
  SITES_DIR: z.string(),
  WORKER_LOG_LEVEL: z.string().optional(),
});

function parseEnv() {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:");
    console.error(JSON.stringify(z.treeifyError(result.error), null, 2));
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();
