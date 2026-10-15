#!/usr/bin/env node

import { program } from "./program";
import { commands } from "./commands";

program
  .addCommand(commands.auth)
  .addCommand(commands.sites)

await program.parseAsync(process.argv);
