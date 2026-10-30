import { formatError, handleApiError } from "@/lib/server/error";
import { QueryKeys } from "@/lib/server/query";
import { event, PageableSchema, validate } from "@/lib/server/utils";
import { paths } from "@/router";
import { liveQuery, query } from "@solidjs/router";
import { redirect, respond } from "@solidjs/web";
import "zod/compile";
import * as z from "zod";
import { zipSync } from "fflate";
import { poll, invalidatePoll } from "@/lib/server/polling";
import { liveSite } from "@/data/sites";
import { ApiClient } from "@dockside/api-client";

export const listDeployments = query(
  async (siteId: number, params?: z.infer<typeof PageableSchema>) => {
    "use server";
    const { session, api } = event().locals;
    if (session == null) throw redirect(paths.login());

    validate(z.number(), siteId);
    validate(PageableSchema, params);

    const page = await api.deployments.history({ siteId, ...params }).catch(handleApiError);
    return page;
  },
  QueryKeys.DEPLOYMENTS_LIST,
);

const LIVE_DEPLOYMENT_POLLING_DELAY_MS = 5000;
export const liveDeployments: ReturnType<
  typeof liveQuery<
    (
      siteId: number,
      params?: z.infer<typeof PageableSchema>,
    ) => AsyncGenerator<Awaited<ReturnType<ApiClient["deployments"]["history"]>>, void, unknown>
  >
> = liveQuery(async function* (siteId: number, params?: z.infer<typeof PageableSchema>) {
  "use server";
  const { session, api, sessionStore } = event().locals;
  if (session == null) throw redirect(paths.login());

  validate(z.number(), siteId);
  validate(PageableSchema, params);

  yield* poll(
    async () => {
      const currentSession = await sessionStore.get(session.id);
      if (currentSession == null) throw redirect(paths.login());
      const page = await api.deployments.history({ siteId, ...params }).catch(handleApiError);
      return page;
    },
    LIVE_DEPLOYMENT_POLLING_DELAY_MS,
    liveDeployments.keyFor(siteId, params),
  );
}, QueryKeys.LIVE_DEPLOYMENTS);

export const rollback = async (id: number) => {
  "use server";
  const { session, api } = event().locals;
  if (session == null) throw redirect(paths.login());

  validate(z.number(), id);

  await api.deployments.rollback({ id }).catch(handleApiError);
  invalidatePoll(liveDeployments.key);
  invalidatePoll(liveSite.key);
};

const MAX_SIZE_IN_BYTES = 50 * 1024 * 1024; // 50MB

async function toUploadBlob(files: File[]): Promise<{ file: Blob; source: string }> {
  if (files.length == 1) {
    const file = files[0];
    const raw = new Uint8Array(await file.arrayBuffer());

    if (file.name.endsWith(".zip")) {
      if (raw[0] !== 0x50 || raw[1] !== 0x4b) throw new Error(`not a zip: ${file.name}`);
      return { file: new Blob([raw], { type: "application/zip" }), source: "zip" };
    }
    if (/\.(html?)$/i.test(file.name)) {
      return {
        file: new Blob([zipSync({ "index.html": raw })], { type: "application/zip" }),
        source: "file",
      };
    }

    throw new Error(`cannot deploy ${file.name}: single files must be .html or .zip`);
  }

  const fileRawMap = Object.fromEntries(
    await Promise.all(
      files.map(async (file) => [file.name, new Uint8Array(await file.arrayBuffer())] as const),
    ),
  );
  return {
    file: new Blob([zipSync(fileRawMap)], { type: "application/zip" }),
    source: "dir",
  };
}

const DeploySchema = z
  .object({
    siteId: z.number(),
    individualFiles: z.array(z.instanceof(File)),
    folderFiles: z.array(z.instanceof(File)),
  })
  .superRefine((data, ctx) => {
    const individualFilesCount = data.individualFiles.length;
    const folderFilesCount = data.folderFiles.length;

    if (individualFilesCount > 0 && folderFilesCount > 0) {
      ctx.addIssue({
        code: "custom",
        message: "cannot upload both files and folders together",
        path: ["individualFiles"],
      });
    } else if (individualFilesCount == 0 && folderFilesCount == 0) {
      ctx.addIssue({
        code: "custom",
        message: "no files uploaded",
        path: ["individualFiles"],
      });
    } else if (individualFilesCount > 1) {
      ctx.addIssue({
        code: "custom",
        message: "cannot upload multiple files",
        path: ["individualFiles"],
      });
    }
  });

export const deploy = async (siteId: number, form: FormData) => {
  "use server";
  const { session, api } = event().locals;
  if (session == null) throw redirect(paths.login());

  const payload = {
    siteId,
    individualFiles: form.getAll("file").filter((f) => f instanceof File && f.name !== ""),
    folderFiles: form.getAll("folder").filter((f) => f instanceof File && f.name !== ""),
  };
  validate(DeploySchema, payload);

  const packed = await (() => {
    if (payload.individualFiles.length > 0) {
      return toUploadBlob(payload.individualFiles);
    } else {
      return toUploadBlob(payload.folderFiles);
    }
  })()
    .then((p) => {
      if (p.file.size > MAX_SIZE_IN_BYTES) {
        throw new Error("Upload too large, must be less than 50MB");
      }
      return p;
    })
    .catch((error) => {
      throw respond(formatError("BAD_REQUEST", (error as Error).message, null), { status: 400 });
    });

  await api.deployments.upload({ siteId: payload.siteId, file: packed.file }).catch(handleApiError);
  invalidatePoll(liveDeployments.key);
};
