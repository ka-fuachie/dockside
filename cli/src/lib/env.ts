import * as z from "zod";

const EnvSchema = z.object({
  API_URL: z.url(),
  DOCKSIDE_PROFILE: z.string().optional(),
  DOCKSIDE_API: z.string().optional(),
});

function parseEnv() {
  const result = EnvSchema.safeParse({
    ...process.env,
    API_URL: process.env.API_URL,
  });

  if (!result.success) {
    console.error("Invalid environment variables:");
    console.error(JSON.stringify(z.treeifyError(result.error), null, 2));
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();
