import { ApiClient } from "@dockside/api-client";
import { progress } from "./io";

export async function resolveSiteId(api: ApiClient, ref: string) {
  const asId = Number(ref);
  if (Number.isInteger(asId)) return asId;

  const page = await api.sites.list({ q: ref, size: 100 });
  const exact = page.content.find((s) => s.slug === ref);
  const matches = exact ? [exact] : page.content;
  if (matches.length === 0) throw new Error(`unknown site "${ref}"`);
  if (matches.length > 1) {
    throw new Error(
      `"${ref}" is ambiguous, matches: ${matches.map((s) => s.slug).join(", ")}`,
    );
  }
  return matches[0].id;
}

/** Log lines below this length are shown whole, longer ones tail-truncated. */
const LOG_TAIL_CHARS = 3000;

export function tail(text: string) {
  if (text.length <= LOG_TAIL_CHARS) return text;
  return "…" + text.slice(-LOG_TAIL_CHARS);
}

export async function reportIncident(
  api: ApiClient,
  deploymentId: number,
  asJson: boolean,
): Promise<{ reason: string; logs: string | null } | null> {
  const incidents = await api.incidents.list({ deploymentId }).catch(() => []);
  const incident = incidents[0];
  if (incident == null) return null;

  if (asJson) return { reason: incident.reason, logs: incident.logs ?? null };

  progress(asJson, () => `reason: ${incident.reason}`);
  const logs = incident.logs ?? null;
  if (logs != null && logs.trim() !== "") {
    progress(asJson, () => `--- last logs ---`);
    progress(asJson, () => tail(logs));
  } else {
    progress(asJson, () => `no logs attached to this incident`);
  }
  return null;
}
