import { query } from "@solidjs/router";
import { event, validate } from "@/lib/server/utils";
import { handleApiError } from "@/lib/server/error";
import { redirect } from "@solidjs/web";
import { paths } from "@/router";
import { QueryKeys } from "@/lib/server/query";
import * as z from "zod";

export const getIncidents = query(async (deploymentId: number) => {
  "use server";
  const { session, api } = event().locals;
  if (session == null) throw redirect(paths.login());

  validate(z.number(), deploymentId);

  return api.incidents.list({ deploymentId }).catch(handleApiError);
}, QueryKeys.INCIDENTS_LIST);
