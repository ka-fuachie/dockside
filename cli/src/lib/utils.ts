import { ApiClient } from "@dockside/api-client";

export async function resolveSiteId(api: ApiClient, ref: string) {
  const asId = Number(ref);
  if (Number.isInteger(asId)) return asId;
  const page = await api.sites.list({ page: 0, size: 100 });
  const found = page.content.find((s) => s.slug === ref);
  if (!found) throw new Error(`unknown site "${ref}"`);
  return found.id;
}
