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

export function print(asJson: boolean, data: unknown, str: () => string) {
  if (asJson) process.stdout.write(JSON.stringify(data) + "\n");
  else process.stderr.write(str() + "\n");
}

export function fail(asJson: boolean, code: string, message: string): never {
  if (asJson) process.stdout.write(JSON.stringify({ code, message }) + "\n");
  else process.stderr.write(`error [${code}]: ${message}\n`);
  process.exit(1);
}

export function formatList(list: unknown[][], gap: string) {
  const stringList = list.map((row) => row.map((item) => String(item)));
  const maxLen = stringList.reduce(
    (acc, row) => row.map((item, i) => Math.max(item.length, acc[i] ?? 0)),
    [] as number[],
  );

  return stringList
    .map((row) => row.map((item, i) => item.padEnd(maxLen[i], " ")).join(gap))
    .join("\n");
}
