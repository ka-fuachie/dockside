import "zod/compile";
import * as z from "zod";
import { entry, HealthCheckSchema } from "./utils";

const HistoryRequestSchema = z.object({
  siteId: z.number(),
  limit: z.number().optional(),
});

export const healthChecks = {
  history: entry(HistoryRequestSchema, z.array(HealthCheckSchema), (payload, ctx) =>
    ctx.get(`sites/${payload.siteId}/health-checks`, {
      query: { limit: payload.limit },
    }),
  ),
} as const;
