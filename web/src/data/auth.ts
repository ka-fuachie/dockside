import "zod/compile";
import * as z from "zod";
import { event, validate } from "../lib/server/utils";
import { setSessionId } from "../server/session";
import { redirect } from "@solidjs/web";
import { handleApiError } from "../lib/server/error";

export function safeNext(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return undefined;
  if (value.startsWith("/login")) return undefined;
  return value;
}

const LoginPayloadSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function login(form: FormData) {
  "use server";
  const payload = {
    username: form.get("username"),
    password: form.get("password"),
  };
  validate(LoginPayloadSchema, payload);

  const { api, sessionStore } = event().locals;
  const res = await api.auth.login(payload).catch(handleApiError);
  const session = await sessionStore.create(res.accessToken, res.refreshToken);
  await setSessionId(event(), session.id);

  return redirect(safeNext(form.get("next")) ?? "/");
}
