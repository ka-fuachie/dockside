#!/usr/bin/env node

import { program } from "./program";
import { commands } from "./commands";

program
  .addCommand(commands.login)
  .addCommand(commands.logout)
  .addCommand(commands.sites)
  .addCommand(commands.deployments)
  .addCommand(commands.rollback)
  .addCommand(commands.validate)
  .addCommand(commands.deploy);

await program.parseAsync(process.argv);
