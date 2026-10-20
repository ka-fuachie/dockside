import "server-only";
import { createClient } from "redis";
import env from "virtual:env/server";

const client = createClient({
  password: env.REDIS_PASSWORD,
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    reconnectStrategy: (retries) => Math.min(retries * 50, 3000),
  },
});

let connecting: Promise<any> | null = null;

export async function redis() {
  connecting ??= client.connect().catch((err) => {
    connecting = null;
    throw err;
  });
  await connecting;
  return client;
}
