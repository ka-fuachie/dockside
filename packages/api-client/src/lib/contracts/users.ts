import "zod/compile";
import * as z from "zod";
import { entry, PageableSchema, UserSchema, pageOf } from "./utils";

const CreateRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
  role: z.enum(["ADMIN", "DEV"]),
});

const ChangeRoleRequestSchema = z.object({
  id: z.number(),
  role: z.enum(["ADMIN", "DEV"]),
});

const DeleteRequestSchema = z.object({
  id: z.number(),
});

export const users = {
  list: entry(z.union([PageableSchema, z.void()]), pageOf(UserSchema), (payload, ctx) =>
    ctx.get("users", {
      query: {
        page: payload?.page,
        size: payload?.size,
      },
    }),
  ),
  create: entry(CreateRequestSchema, UserSchema, (payload, ctx) =>
    ctx.post("users", {
      body: {
        username: payload.username,
        password: payload.password,
        role: payload.role,
      },
    }),
  ),
  changeRole: entry(ChangeRoleRequestSchema, UserSchema, (payload, ctx) =>
    ctx.put(`users/${payload.id}/role`, {
      body: { role: payload.role },
    }),
  ),
  remove: entry(DeleteRequestSchema, z.null(), (payload, ctx) =>
    ctx.delete(`users/${payload.id}`),
  ),
} as const;
