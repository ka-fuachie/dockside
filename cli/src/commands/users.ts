import { Command } from "@commander-js/extra-typings";
import { program } from "../program";
import { createAuthedClient } from "../api";
import { getProfile } from "../lib/config";
import { confirm, fail, formatList, print, c } from "../lib/io";
import { ApiClient } from "@dockside/api-client";

async function resolveUserId(api: ApiClient, ref: string) {
  const asId = Number(ref);
  if (Number.isInteger(asId)) return asId;

  const page = await api.users.list({ q: ref, size: 100 });
  const exact = page.content.find((u) => u.username === ref);
  const matches = exact ? [exact] : page.content;
  if (matches.length === 0) throw new Error(`unknown user "${ref}"`);
  if (matches.length > 1) {
    throw new Error(
      `"${ref}" is ambiguous, matches: ${matches.map((u) => u.username).join(", ")}`,
    );
  }
  return matches[0].id;
}

export const users = new Command().name("users").description("user operations");

users
  .command("list")
  .option("--q <query>")
  .option("--role <role>")
  .action(async (cmd) => {
    const opts = program.opts();
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const page = await api.users.list({ q: cmd.q, role: cmd.role as "ADMIN" | "DEV" });
      print(!!opts.json, page.content, () => {
        const rows = page.content.map((u) => [
          u.username,
          u.role,
          c.dim(u.createdAt),
        ]);
        const header = ["username", "role", "created"].map((h) => c.dim(h));
        return formatList(rows.length > 0 ? [header, ...rows] : rows, " ".repeat(4));
      });
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });

users
  .command("create")
  .argument("<username>")
  .requiredOption("--password <p>")
  .requiredOption("--role <role>")
  .action(async (username, cmd) => {
    const opts = program.opts();
    if (cmd.role !== "ADMIN" && cmd.role !== "DEV") {
      fail(!!opts.json, "BAD_ROLE", `invalid role "${cmd.role}", use ADMIN or DEV`);
    }
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const user = await api.users.create({ username, password: cmd.password, role: cmd.role });
      print(!!opts.json, user, () => `created ${user.username} (${user.role})`);
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });

users
  .command("role")
  .argument("<user>")
  .requiredOption("--to <role>")
  .action(async (ref, cmd) => {
    const opts = program.opts();
    if (cmd.to !== "ADMIN" && cmd.to !== "DEV") {
      fail(!!opts.json, "BAD_ROLE", `invalid role "${cmd.to}", use ADMIN or DEV`);
    }
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const user = await api.users.changeRole({
        id: await resolveUserId(api, ref),
        role: cmd.to,
      });
      print(!!opts.json, user, () => `${user.username} is now ${user.role}`);
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });

users
  .command("remove")
  .argument("<user>")
  .option("--yes", "skip confirmation")
  .action(async (ref, cmd) => {
    const opts = program.opts();
    try {
      const api = await createAuthedClient(getProfile(opts.profile));
      const id = await resolveUserId(api, ref);
      if (!cmd.yes) {
        const ok = await confirm(`delete user #${id}?`);
        if (!ok) {
          print(!!opts.json, { ok: false, cancelled: true }, () => `cancelled`);
          return;
        }
      }
      await api.users.remove({ id });
      print(!!opts.json, { ok: true, id }, () => `deleted user #${id}`);
    } catch (err: any) {
      fail(!!opts.json, err.code ?? "REQUEST_FAILED", err.message);
    }
  });
