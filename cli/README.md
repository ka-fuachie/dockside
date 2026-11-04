# cli

The cli supports everything the dashboard does. Use it instead of the dashboard, in scripting workflows, or hand it to AI agents to operate the system.

## Development

From the repo root:

```bash
pnpm start:cli -- <command>
# e.g.
pnpm start:cli -- sites list
pnpm start:cli -- deploy ./dist --site demo-multi --wait
```

## Profiles

Sessions are stored per profile in `~/.config/dockside/<profile>.json` (access + refresh tokens, auto-refreshed). Pick one with `--profile <name>` or `DOCKSIDE_PROFILE` env. Defaults to `dev`.

```bash
dockside whoami --profile <name>
DOCKSIDE_PROFILE=<name> dockside whoami
```

## Global install

To use the cli globally without having to always run it inside the project dir, we can link it globally

```bash
# linking runs the built output, so build first
pnpm -r build
pnpm link:cli
```

The cli is now available globally as `dockside`

```bash
dockside whoami
```

It can then be later unlinked/uninstalled globally by running `pnpm unlink:cli`

## Commands

```bash
dockside login
dockside whoami

dockside sites list --status up
dockside sites get demo-hello

dockside deploy ./dist --site demo-hello          # zip, folder, or single html
dockside deploy ./dist --site demo-hello --wait   # poll until done, print incident logs on failure

dockside rollback --site demo-hello --to 5 --wait  # re-activate a previous success version
```

Every command takes `--json` flag for structured json outputs and `--profile`, for selecting which auth profile to use for the command.

Run `dockside --help` for the full command list (users and logs management included).
