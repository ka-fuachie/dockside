import "zod/compile";
import * as z from "zod";
import { ApiRequestInit } from "../request";

export type ContractContext = {
  post: (url: string, init?: ApiRequestInit) => Promise<Response>;
  get: (url: string, init?: ApiRequestInit) => Promise<Response>;
  signal?: AbortSignal;
};

export const ContractEntityResponseKind = {
  JSON: "json",
  BYTES: "bytes",
};

export type ContractEntry<Req extends z.ZodType, Res extends z.ZodType> = {
  RequestSchema: Req;
  ResponseSchema: Res;
  handler: (payload: z.infer<Req>, ctx: ContractContext) => Promise<Response>;
  responseKind: (typeof ContractEntityResponseKind)[keyof typeof ContractEntityResponseKind];
};

export type ContractClient<T extends Record<string, ContractEntry<any, any>>> = {
  [K in keyof T]: (
    payload: z.infer<T[K]["RequestSchema"]>,
    opts?: { signal?: AbortSignal },
  ) => Promise<z.infer<T[K]["ResponseSchema"]>>;
};

export function entry<Req extends z.ZodType, Res extends z.ZodType>(
  RequestSchema: Req,
  ResponseSchema: Res,
  handler: ContractEntry<Req, Res>["handler"],
  responseKind?: ContractEntry<Req, Res>["responseKind"],
): ContractEntry<Req, Res> {
  return {
    RequestSchema,
    ResponseSchema,
    handler,
    responseKind: responseKind ?? ContractEntityResponseKind.JSON,
  };
}

export function pageOf<T extends z.ZodType<any, any>>(item: T) {
  return z.object({
    content: z.array(item),
    totalElements: z.number(),
    totalPages: z.number(),
    number: z.number(),
    size: z.number(),
  });
}

export const PageableSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
});

export const SiteSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  currentVersion: z.number().nullable(),
  createdAt: z.string(),
});

export const DeploymentStatusSchema = z.enum(["running", "success", "failed"]);

export const DeploymentSchema = z.object({
  id: z.number(),
  siteId: z.number(),
  siteSlug: z.string(),
  version: z.number(),
  status: DeploymentStatusSchema,
  createdAt: z.string(),
});
