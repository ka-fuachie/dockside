import { Command } from "@commander-js/extra-typings";

export const program = new Command()
  .name("dockside")
  .option("--json", "machine-readable output")
  .option("--profile <name>", "config profile", "dev")
  .addHelpText(
    "after",
    `
Environment:
  DOCKSIDE_PROFILE   default for --profile (default: "dev")
  DOCKSIDE_API       default api url at login (default: http://localhost:$API_PORT)`,
  );
