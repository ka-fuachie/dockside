import "zod/compile";
import * as z from "zod";

const Claims = z.object({
  sub: z.string(),
  role: z.string(),
});

/** Display-only identity claims from an access token payload (no signature verification). */
export function decodeAccessClaims(accessToken: string) {
  const segment = accessToken.split(".")[1];
  if (segment == null) return null;

  let payload: unknown;
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    payload = JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
  } catch {
    return null;
  }

  const parsed = Claims.safeParse(payload);
  if (!parsed.success) return null;

  return { username: parsed.data.sub, role: parsed.data.role };
}
