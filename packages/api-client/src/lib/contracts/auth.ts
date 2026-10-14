import "zod/compile";
import * as z from "zod";
import { entry } from "./utils";

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

const LoginRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

export const auth = {
  login: entry(LoginRequestSchema, AuthResponseSchema, (payload, ctx) =>
    ctx.post("auth/login", {
      body: {
        username: payload.username,
        password: payload.password,
      },
    }),
  ),
  refresh: entry(RefreshRequestSchema, AuthResponseSchema, (payload, ctx) =>
    ctx.post("auth/refresh", {
      body: {
        refreshToken: payload.refreshToken,
      },
    }),
  ),
} as const;
