import "zod/compile";
import * as z from "zod";
import { entry, PageableSchema } from "./utils";
import { DeploymentSchema, SiteSchema, pageOf } from "./utils";

const UploadRequestSchema = z.object({
  siteId: z.number(),
  file: z.instanceof(Blob),
});

const HistoryRequestSchema = PageableSchema.safeExtend({
  siteId: z.number(),
});

const RollbackRequestSchema = z.object({
  id: z.number(),
});

export const deployments = {
  upload: entry(UploadRequestSchema, DeploymentSchema, (payload, ctx) => {
    const form = new FormData();
    form.append("file", payload.file);
    return ctx.post(`sites/${payload.siteId}/deployments`, {
      body: form,
    });
  }),
  history: entry(HistoryRequestSchema, pageOf(DeploymentSchema), (payload, ctx) =>
    ctx.get(`sites/${payload.siteId}/deployments`, {
      query: {
        page: payload.page,
        size: payload.size,
      },
    }),
  ),
  rollback: entry(RollbackRequestSchema, SiteSchema, (payload, ctx) =>
    ctx.post(`deployments/${payload.id}/rollback`),
  ),
} as const;
