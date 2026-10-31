import { read } from "read";

export async function ask(prompt: string, hidden: boolean, default_?: string) {
  try {
    return await read({
      prompt,
      silent: hidden,
      default: default_,
    });
  } finally {
    if (hidden) process.stdout.write("\n");
  }
}

/** y/n prompt — true when the user confirms, false otherwise */
export async function confirm(prompt: string) {
  const answer = await read({ prompt: `${prompt} [y/N]: `, default: "N" });
  return answer.trim().toLowerCase() === "y";
}

export function print(asJson: boolean, data: unknown, str: () => string) {
  if (asJson) process.stdout.write(JSON.stringify(data) + "\n");
  else process.stderr.write(str() + "\n");
}

export function fail(asJson: boolean, code: string, message: string): never {
  if (asJson) process.stdout.write(JSON.stringify({ code, message }) + "\n");
  else process.stderr.write(`error [${code}]: ${message}\n`);
  process.exit(1);
}

/** stderr progress line — skipped under --json so machine output stays parseable */
export function progress(asJson: boolean, str: () => string) {
  if (asJson) return;
  process.stderr.write(str() + "\n");
}

function stripAnsi(s: string) {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

export function formatList(list: unknown[][], gap: string) {
  const stringList = list.map((row) => row.map((item) => String(item)));
  const widths = stringList
    .map((row) => row.map((item) => stripAnsi(item).length))
    .reduce(
      (acc, row) => row.map((item, i) => Math.max(item, acc[i] ?? 0)),
      [] as number[],
    );

  return stringList
    .map((row) =>
      row
        .map((item, i) => item + " ".repeat(Math.max(0, widths[i] - stripAnsi(item).length)))
        .join(gap),
    )
    .join("\n");
}

const useColor = !!process.stdout.isTTY && !process.env.NO_COLOR && !process.env.CI;

function wrap(code: string, text: string) {
  return useColor ? `\x1b[${code}m${text}\x1b[0m` : text;
}

export const c = {
  dim: (s: string) => wrap("2", s),
  bold: (s: string) => wrap("1", s),
  red: (s: string) => wrap("31", s),
  green: (s: string) => wrap("32", s),
  yellow: (s: string) => wrap("33", s),
};

const GLYPHS = process.stdout.isTTY && !process.env.CI;

export function statusGlyph(status: string) {
  if (!GLYPHS) return status;
  if (status === "success") return c.green("✓");
  if (status === "failed") return c.red("✗");
  return c.yellow("●");
}

export function healthGlyph(
  up: boolean | null | undefined,
  deployed: boolean | null | undefined,
) {
  if (!GLYPHS) {
    if (deployed === false) return "unavailable";
    if (up == null) return "unknown";
    return up ? "up" : "down";
  }
  if (deployed === false) return c.dim("· unavailable");
  if (up == null) return c.dim("· unknown");
  return up ? c.green("● up") : c.red("● down");
}
