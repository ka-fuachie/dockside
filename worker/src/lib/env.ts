import * as z from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  AGENT_TOKEN: z.string(),
  API_URL: z.url(),
  WORKER_PORT: z.coerce.number(),
  SITES_DIR: z.string(),
  SITES_BASE_URL: z.url(),
  WORKER_LOG_LEVEL: z.string().optional(),
});

function parseEnv() {
  const result = EnvSchema.safeParse({
    API_URL: process.env.API_URL,
    AGENT_TOKEN: process.env.AGENT_TOKEN,
    WORKER_PORT: process.env.WORKER_PORT,
    SITES_DIR: process.env.SITES_DIR,
    SITES_BASE_URL: process.env.SITES_BASE_URL,
    WORKER_LOG_LEVEL: process.env.WORKER_LOG_LEVEL,
    ...process.env,
  });

  if (!result.success) {
    console.error("Invalid environment variables:");
    console.error(JSON.stringify(z.treeifyError(result.error), null, 2));
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();
