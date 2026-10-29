import "zod/compile";
import * as z from "zod";
import { query } from "@solidjs/router";
import { event, PageableSchema, validate } from "@/lib/server/utils";
import { redirect, respond } from "@solidjs/web";
import { paths } from "@/router";
import { QueryKeys } from "@/lib/server/query";
import { formatError, handleApiError } from "../lib/server/error";
import { slugify } from "@/lib/utils";
import env from "virtual:env/server";

const SiteListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  q: z.string().min(1).optional(),
  status: z.enum(["up", "down"]).optional(),
});

export const getSitesList = query(async (params?: z.input<typeof SiteListParamsSchema>) => {
  "use server";
  const { session, api } = event().locals;
  if (session == null) throw redirect(paths.login());

  validate(SiteListParamsSchema, params);

  const page = await api.sites.list(params).catch(handleApiError);
  return page;
}, QueryKeys.SITES_LIST);

export const getSite = query(async (slug: string) => {
  "use server";
  const { session, api } = event().locals;
  if (session == null) throw redirect(paths.login());

  validate(z.string().min(1), slug);

  const sites = await api.sites.list().catch(handleApiError);
  const siteId = sites.content.find((site) => site.slug === slug)?.id;
  if (siteId == null) throw respond(formatError("NOT_FOUND", "site not found"), { status: 404 });

  const site = await api.sites.one({ id: siteId }).catch(handleApiError);
  return site;
}, QueryKeys.SITE);

const CreateSitePayloadSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]*$/),
});

export const createSite = async (form: FormData) => {
  "use server";
  let payload = {
    name: form.get("name"),
    slug: form.get("slug"),
  };
  validate(CreateSitePayloadSchema, payload);

  if (payload.slug == "") {
    payload.slug = slugify(payload.name) ?? "";
  }

  const { session, api } = event().locals;
  if (session == null)
    throw respond(formatError("UNAUTHORIZED", "authentication required"), { status: 401 });

  const site = await api.sites.create(payload).catch(handleApiError);
  return redirect(paths.sites(site.slug));
};

export const getSiteUrl = query(async (slug: string) => {
  "use server";
  return Promise.resolve(`${env.SITES_BASE_URL}/sites/${slug}/`);
}, QueryKeys.SITE + "--url");
