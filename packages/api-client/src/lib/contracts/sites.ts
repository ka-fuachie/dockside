import "zod/compile";
import * as z from "zod";
import { entry, PageableSchema } from "./utils";
import { SiteSchema, pageOf } from "./utils";

const ListRequestSchema = PageableSchema.extend({
  q: z.string().optional(),
  status: z.enum(["up", "down"]).optional(),
});

const CreateRequestSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

const OneRequestSchema = z.object({
  id: z.number(),
});

export const sites = {
  list: entry(z.union([ListRequestSchema, z.void()]), pageOf(SiteSchema), (payload, ctx) =>
    ctx.get("sites", {
      query: {
        page: payload?.page,
        size: payload?.size,
        q: payload?.q,
        status: payload?.status,
      },
    }),
  ),
  create: entry(CreateRequestSchema, SiteSchema, (payload, ctx) =>
    ctx.post("sites", {
      body: {
        slug: payload.slug,
        name: payload.name,
      },
    }),
  ),
  one: entry(OneRequestSchema, SiteSchema, (payload, ctx) => ctx.get(`sites/${payload.id}`)),
} as const;
