import "server-only";
import { randomUUID } from "node:crypto";

export interface SessionRecord {
  id: string;
  accessToken: string;
  refreshToken: string;
  createdAt: number;
}

const TTL = 1000 * 60 * 60 * 24 * 30;

export class SessionStore {
  #records: Map<string, SessionRecord>;

  constructor() {
    this.#records = new Map();
  }

  create(accessToken: string, refreshToken: string) {
    const record = { id: randomUUID(), accessToken, refreshToken, createdAt: Date.now() };
    this.#records.set(record.id, record);
    return record;
  }

  get(id: string) {
    const row = this.#records.get(id);
    if (!row) return null;
    if (Date.now() - row.createdAt > TTL) {
      this.#records.delete(id);
      return null;
    }
    return row;
  }

  setAccessToken(id: string, accessToken: string) {
    const row = this.#records.get(id);
    if (row) this.#records.set(id, { ...row, accessToken });
  }

  destroy(id: string) {
    this.#records.delete(id);
  }
}
