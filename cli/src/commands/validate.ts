import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "@commander-js/extra-typings";
import { program } from "../program";
import { parseDeploymentConfig } from "@dockside/deployment-config";
import { fail, print } from "../lib/io";

export const validate = new Command()
  .name("validate")
  .argument("<dir>")
  .action(async (dir) => {
    const opts = program.opts();
    try {
      const toml = await fs.readFile(path.join(dir, "dockside.toml"), "utf8").catch(() => null);
      const parsed = parseDeploymentConfig(toml);
      print(!!opts.json, parsed, () =>
        [`publish: ${parsed.publish}`, ...parsed.warnings.map((w) => `warn: ${w}`)].join("\n"),
      );
    } catch (err: any) {
      fail(!!opts.json, "INVALID_CONFIG", err.message);
    }
  });
