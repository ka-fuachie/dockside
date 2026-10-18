import { createCookie } from "@remix-run/cookie";
import { RequestEvent } from "@solidjs/web";
import "server-only";
import env from "virtual:env/server";

const THIRTY_DAYS_SECS = 60 * 60 * 24 * 30;
const maxAge = THIRTY_DAYS_SECS;

const sessionCookie = createCookie("sid", {
  secrets: env.WEB_SESSION_SECRET.split(","),
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
  maxAge,
});

export async function getSessionId(event: RequestEvent) {
  const raw = await sessionCookie.parse(event.request.headers.get("cookie"));
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export async function setSessionId(event: RequestEvent, id: string) {
  event.response.headers.append("set-cookie", await sessionCookie.serialize(id));
}

export async function clearSessionId(event: RequestEvent) {
  event.response.headers.append("set-cookie", await sessionCookie.serialize("", { maxAge: 0 }));
}
