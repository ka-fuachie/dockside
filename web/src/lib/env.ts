import "zod/compile";
import * as z from "zod";

const EnvSchema = z.object({
  API_URL: z.url(),
  SITES_BASE_URL: z.url(),
});

function parseEnv() {
  const result = EnvSchema.safeParse({
    API_URL: import.meta.env.API_URL,
    SITES_BASE_URL: import.meta.env.SITES_BASE_URL,
  });

  if (!result.success) {
    console.error("Invalid environment variables:");
    console.error(JSON.stringify(z.treeifyError(result.error), null, 2));
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();
