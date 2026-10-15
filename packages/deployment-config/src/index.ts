import { parse as parseToml } from "smol-toml";

export type DeploymentConfig = {
  publish: string;
  warnings: string[];
};

const DefaultConfig: DeploymentConfig = {
  publish: ".",
  warnings: [],
};

export const DEPLOYMENT_CONFIG_FILE = "dockside.toml";

const ALLOWED_KEYS = new Set(["publish"]);

export function parseDeploymentConfig(source: string | null) {
  if (source == null) return DefaultConfig;

  const normalisedSource = source.trim();
  if (normalisedSource == "") return DefaultConfig;

  let table: unknown;
  try {
    table = parseToml(normalisedSource);
  } catch (err) {
    throw new Error(`invalid dockside.toml: ${(err as Error).message}`);
  }

  if (typeof table !== "object" || table === null || Array.isArray(table)) {
    throw new Error("invalid dockside.toml: top level must be a table");
  }

  const warnings: string[] = [];
  for (const key of Object.keys(table as Record<string, unknown>)) {
    if (!ALLOWED_KEYS.has(key)) {
      warnings.push(`unknown key "${key}" ignored`);
    }
  }

  const raw = (table as Record<string, unknown>).publish;
  if (raw === undefined) return { publish: ".", warnings };
  if (typeof raw !== "string" || raw.trim() === "")
    throw new Error('invalid dockside.toml: "publish" must be a non-empty string');

  return { publish: normalizePublish(raw), warnings };
}

function normalizePublish(raw: string): string {
  const p = raw.trim().replace(/\\/g, "/").replace(/\/+$/, "").replace(/^\.\//, "");
  if (p === "" || p === ".") return ".";
  if (p.startsWith("/") || p.split("/").includes("..")) {
    throw new Error(
      `invalid dockside.toml: "publish" must stay inside the package: ${JSON.stringify(raw)}`,
    );
  }
  return p;
}
