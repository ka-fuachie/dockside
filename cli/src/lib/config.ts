import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import "zod/compile";
import * as z from "zod";
import { env } from "./env";

const DEFAULT_PROFILE = "dev";
export const getProfile = (value?: string) => value ?? env.DOCKSIDE_PROFILE ?? DEFAULT_PROFILE;

export const DEFAULT_API_URL = `http://localhost:${env.API_PORT}`;
// export const getBaseApiUrl = () => env.DOCKSIDE_API ?? DEFAULT_API_URL
export const getApiUrl = async (value?: string, readInput?: () => Promise<string>) =>
  value ??
  env.DOCKSIDE_API ??
  readInput?.().then((input) => input || DEFAULT_API_URL) ??
  DEFAULT_API_URL;

const SessionSchema = z.object({
  baseUrl: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type Session = z.infer<typeof SessionSchema>;

const STORAGE_DIR = path.join(os.homedir(), ".config", "dockside");
const getFile = (profile: string) => path.join(STORAGE_DIR, `${profile}.json`);

export async function loadSession(profile: string) {
  let data: string;
  try {
    data = await fs.readFile(getFile(profile), "utf-8");
  } catch {
    return null;
  }

  return SessionSchema.parse(JSON.parse(data));
}

export async function saveSession(profile: string, session: Session) {
  const file = getFile(profile);
  const data = JSON.stringify(session, null, 2);
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.writeFile(file, data, { mode: 0o600 });
  await fs.chmod(file, 0o600).catch(() => {});
}

export async function clearSession(profile: string) {
  await fs.rm(getFile(profile), { force: true });
}
