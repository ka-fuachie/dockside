import "zod/compile";
import * as z from "zod";
import { ContractEntityResponseKind, entry, SiteSchema } from "./utils";
import { DeploymentSchema } from "./utils";

const ArtifactRequestSchema = z.object({
  deploymentId: z.number(),
});

const ArtifactResponseSchema = z.instanceof(Uint8Array);

const ResultRequestSchema = z.object({
  deploymentId: z.number(),
  success: z.boolean(),
  logs: z.string().optional(),
});

const ActivateRequestSchema = z.object({
  deploymentId: z.number(),
});

export const agent = {
  nextJob: entry(z.void(), DeploymentSchema.nullable(), (_payload, ctx) =>
    ctx.get("agent/next-job"),
  ),
  artifact: entry(
    ArtifactRequestSchema,
    ArtifactResponseSchema,
    (payload, ctx) => ctx.get(`agent/deployments/${payload.deploymentId}/artifact`),
    ContractEntityResponseKind.BYTES,
  ),
  result: entry(ResultRequestSchema, DeploymentSchema, (payload, ctx) =>
    ctx.post(`agent/deployments/${payload.deploymentId}/result`, {
      body: {
        success: payload.success,
        logs: payload.logs,
      },
    }),
  ),
  activate: entry(ActivateRequestSchema, SiteSchema, (payload, ctx) =>
    ctx.post(`agent/deployments/${payload.deploymentId}/activate`),
  ),
} as const;
