import "zod/compile";
import * as z from "zod";
import { entry } from "./utils";
import { DeploymentSchema } from "./utils";

const NextJobRequestSchema = z.object({});

const ResultRequestSchema = z.object({
  deploymentId: z.number(),
  success: z.boolean(),
  logs: z.string().optional(),
});

export const agent = {
  nextJob: entry(NextJobRequestSchema, DeploymentSchema.nullable(), (_payload, ctx) =>
    ctx.get("agent/next-job"),
  ),
  result: entry(ResultRequestSchema, DeploymentSchema, (payload, ctx) =>
    ctx.post(`agent/deployments/${payload.deploymentId}/result`, {
      body: {
        success: payload.success,
        logs: payload.logs,
      },
    }),
  ),
} as const;
