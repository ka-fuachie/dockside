import "server-only";
import "zod/compile";
import * as z from "zod";
import { randomUUID } from "node:crypto";
import { redis } from "../../server/redis";

const SessionRecordSchema = z.object({
  id: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  createdAt: z.number(),
});

const PersistedSessionRecordSchema = SessionRecordSchema.extend({
  createdAt: z.coerce.number(),
});

export type SessionRecord = z.infer<typeof SessionRecordSchema>;

const TTL_SECS = 60 * 60 * 24 * 30;
const KEY_BASE = "session";
const key = (id: string) => `${KEY_BASE}:${id}`;

export class SessionStore {
  async create(accessToken: string, refreshToken: string) {
    const record = { id: randomUUID(), accessToken, refreshToken, createdAt: Date.now() };
    const client = await redis();
    await client
      .multi()
      .hSet(key(record.id), {
        id: record.id,
        accessToken: record.accessToken,
        refreshToken: record.refreshToken,
        createdAt: String(record.createdAt),
      })
      .expire(key(record.id), TTL_SECS)
      .exec();

    return record;
  }

  async get(id: string) {
    const client = await redis();
    const row = await client.hGetAll(key(id));
    const parsed = PersistedSessionRecordSchema.safeParse(row);
    if (!parsed.success) return null;

    return parsed.data;
  }

  async setTokens(id: string, accessToken: string, refreshToken: string) {
    const client = await redis();
    if (await client.exists(key(id))) {
      await client.hSet(key(id), { accessToken, refreshToken });
    }
  }

  async destroy(id: string) {
    const client = await redis();
    await client.del(key(id));
  }
}
