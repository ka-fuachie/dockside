import "server-only";
import * as z from "zod";

const Claims = z.object({
  sub: z.string(),
  role: z.string(),
});

export function readAccessClaims(accessToken: string) {
  const segment = accessToken.split(".")[1];
  if (!segment) return null;

  let payload: unknown;
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
  } catch {
    return null;
  }

  const parsed = Claims.safeParse(payload);
  if (!parsed.success) return null;

  return {
    username: parsed.data.sub,
    role: parsed.data.role,
  };
}
