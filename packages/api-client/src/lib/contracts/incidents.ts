import "zod/compile";
import * as z from "zod";
import { entry, IncidentSchema } from "./utils";

const ListRequestSchema = z.object({
  deploymentId: z.number(),
});

export const incidents = {
  list: entry(ListRequestSchema, z.array(IncidentSchema), (payload, ctx) =>
    ctx.get(`deployments/${payload.deploymentId}/incidents`),
  ),
} as const;
