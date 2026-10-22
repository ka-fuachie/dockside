import { query } from "@solidjs/router";
import { event } from "../lib/server/utils";
import { readAccessClaims } from "../server/jwt";
import { QueryKeys } from "../lib/server/query";
import { redirect } from "@solidjs/web";
import { paths } from "../router";

export type User = NonNullable<ReturnType<typeof readAccessClaims>>;

export const getCurrentUser = query(async () => {
  "use server";
  const session = event().locals.session;
  if (session == null) return null;
  return readAccessClaims(session.accessToken);
}, QueryKeys.CURRENT_USER);

export const requireUser = query(async (next: string) => {
  "use server";
  const user = await getCurrentUser();
  if (user == null) throw redirect(paths.login({ next }));
  return user;
}, QueryKeys.REQUIRE_USER);
