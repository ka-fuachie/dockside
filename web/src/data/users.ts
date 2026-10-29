import { query } from "@solidjs/router";
import { event, validate } from "@/lib/server/utils";
import { handleApiError } from "@/lib/server/error";
import { redirect, reload } from "@solidjs/web";
import { paths } from "@/router";
import { QueryKeys } from "@/lib/server/query";
import * as z from "zod";
import { readAccessClaims } from "@/server/jwt";

export type User = NonNullable<ReturnType<typeof readAccessClaims>>;

export const getCurrentUser = query(async () => {
  "use server";
  const session = event().locals.session;
  if (session == null) return null;
  return readAccessClaims(session.accessToken);
}, QueryKeys.CURRENT_USER);

export const requireUser = query(async (next: string) => {
  "use server";
  const user = await getCurrentUser();
  if (user == null) throw redirect(paths.login({ next }));
  return user;
}, QueryKeys.REQUIRE_USER);

const CreateUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["ADMIN", "DEV"]),
});

const UsersListParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  q: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "DEV"]).optional(),
});

export const getUsersList = query(async (params?: z.input<typeof UsersListParamsSchema>) => {
  "use server";
  const { session, api } = event().locals;
  if (session == null) throw redirect(paths.login());

  validate(UsersListParamsSchema, params);

  const page = await api.users.list(params).catch(handleApiError);
  return page;
}, QueryKeys.USERS_LIST);

export const createUser = async (form: FormData) => {
  "use server";
  const { session, api } = event().locals;
  if (session == null) throw redirect(paths.login());

  const payload = {
    username: form.get("username"),
    password: form.get("password"),
    role: form.get("role"),
  };

  validate(CreateUserSchema, payload);

  await api.users.create(payload).catch(handleApiError);
  return reload({ revalidate: getUsersList.key });
};

export const deleteUser = async (id: number) => {
  "use server";
  const { session, api } = event().locals;
  if (session == null) throw redirect(paths.login());

  await api.users.remove({ id }).catch(handleApiError);
  return reload({ revalidate: getUsersList.key });
};
