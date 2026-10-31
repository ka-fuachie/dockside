# RUNBOOK — operational manual for a running dockside

> Who this is for: whoever is operating the deployed stack.
> Not for: people learning what dockside is — that's the [README](./README.md).
> Rule of thumb: every entry is commands, in order, with a "known good looks like" line.

## 0. What runs where

| Piece | Runs as | Reaches | Notes |
|---|---|---|---|
| db | postgres:16-alpine container | — | data in `postgres_data` volume |
| api | container (built from `api/Dockerfile`) | db | JVM; serves under `/api` (context-path); healthcheck `/api/actuator/health` |
| web | container (`Dockerfile.web`) | api | Solid 2.0 SSR; built with `VITE_BASE_PATH=/app`; healthcheck `/app/` |
| worker | container (`Dockerfile.worker`) | api (API_URL), nginx (SITES_BASE_URL) | deploy loop + health loop + metrics on `:3001` |
| nginx | official image + env template | web, api, filesystem `/srv/sites` | one server block: `/api/` → api (prefix stripped), `/app/` → web, `/` → 301 `/app/`, `/sites/<slug>/…` → `/srv/sites/<slug>/current/…` |
| prometheus | container | api/worker | `prometheus.prod.yml` in prod mode |
| grafana | container | prometheus | dashboards file-provisioned from `grafana/provisioning/` |

Ports published to the host: nginx (80/443 in prod), prometheus, grafana, db (driver/psql access only).
Everything else is internal-name only (`api`, `web`, `worker`, `nginx`, `db`) on the compose network.

## 1. Daily ops

```bash
# start everything (containers mode)
docker compose -f docker-compose.yml -f compose.prod.yml up -d

# status — expect: all 7 Up, api/worker healthy (the "(healthy)" suffix is the healthcheck verdict)
docker compose -f docker-compose.yml -f compose.prod.yml ps

# logs, one service
docker compose -f docker-compose.yml -f compose.prod.yml logs -f api

# monitoring UI
#   prometheus  -> http://localhost:9090/targets   (all targets UP)
#   grafana     -> http://localhost:3030          (dashboards provisioned from git)
```

## 2. Deploy (site, via CLI)

```bash
dockside deploy --site <slug> <files-or-zip>
# current version activates when worker health-checks the new pages OK;
# rollback is activate-deployments in the CLI (see deployments command group)
```

## 3. Deploy (the stack itself)

First pull on a fresh host (private GHCR packages — once per host):

```bash
docker login ghcr.io -u ka-fuachie
# password = classic PAT, scope read:packages  (github.com/settings/tokens)
# compose picks up the stored credential automatically; no auth config in the compose files
```

```bash
git pull
docker compose -f docker-compose.yml -f compose.prod.yml pull    # images from GHCR once CI lands
docker compose -f docker-compose.yml -f compose.prod.yml up -d
```

If images aren't published yet (CI row not landed): `up -d --build` instead. **Do not mix**:
`up -d` alone reuses existing images — stale code "appears" to deploy silently.

## 4. Restore from backup

```bash
ls backups/                             # pick a stamp
bash scripts/restore.sh 2026-XX-XX-XXXXXX
# refuses on checksum mismatch — real-artifact mismatch means STOP.
# manifest-only mismatch is benign (known script-edit case):
bash scripts/restore.sh <stamp> --ignore-checksum
```

Impact: drops the db schema, wipes `site-data`/`upload-data`, imports from backups/,
restarts the stack. Expect the whole stack back to the state at that backup stamp.

## 5. Disable the artifact checksum gate (deliberately)

Backups are verified by sha256 (`manifest.sha256`). If verification fails:
- `manifest.txt` only → benign; can ignore with the flag above.
- `db.sql.gz` / `sites.tar.gz` / `uploads.tar.gz` → backup is suspect; do NOT restore it.

## 6. Rotating secrets

All runtime secrets live in `.env` on the host (not in the repo, not in images).

```bash
# update the values you need to rotate:
#   API_JWT_SECRET, AGENT_TOKEN, DB_PASSWORD, GF_ADMIN_PASSWORD, WEB_SESSION_SECRET
# then recreate affected services (compose only applies new env on recreate):
docker compose -f docker-compose.yml -f compose.prod.yml up -d --force-recreate api web worker
```

Note: rotating `API_JWT_SECRET` logs out every user (tokens invalid) — expected.
Rotating `AGENT_TOKEN` breaks the worker until they get the new token from `.env`.
Rotating a *node's* GHCR PAT: fresh `docker login ghcr.io -u ka-fuachie` after issuing a new
classic PAT with `read:packages` (pulls 401 when it expires — that's the tell).

## 7. Backups

```bash
bash scripts/backup.sh          # writes backups/<stamp>/{db.sql.gz,sites.tar.gz,uploads.tar.gz,manifest...}
```

- **Cron line (on the server):**

```cron
0 3 * * * cd /opt/dockside && ./scripts/backup.sh >> backups/backup.log 2>&1
```

- **Verify the machine has been running them:**

```bash
ls -lt backups/ | head -5         # newest stamp should be ~today 03:xx
cat backups/backup.log
```

- **Off-host copy (the version of "backup survives my host"):** either a second cron line:
  `rsync` newest folder to another machine / bucket, or manual scp of the newest stamp.
  Whatever you pick: write it here, then live it.

## 8. First boot on a fresh server (when there are no users yet)

```bash
# .env (the runtime one ON THE BOX) — set once:
PROD_ADMIN_USER=<your-user>
PROD_ADMIN_PASSWORD=<a-real-password>
# dockside stack first up:
docker compose -f docker-compose.yml -f compose.prod.yml up -d --build
# the bootstrapper runs ONCE (only if the users table is empty)
# then, from the box (or after first login if you exposed the api to reach the front door):
dockside login --username <your-user> --password <a-real-password> --api-url http://localhost:8080
# NOW delete those two lines from the VPS .env (they're no longer used; leaving them is a footgun)
docker compose -f docker-compose.yml -f compose.prod.yml up -d --force-recreate api   # picks up the change
```

## 9. When it's broken

| Symptom | Look at | Most common causes |
|---|---|---|
| everything down | `docker compose ps` | a container crash-looping (Restarting) — follow its logs |
| 502 from nginx on `/app/` | `docker logs nginx`, check web's `ps` health | upstream DNS resolved before web was up (recreate: `up -d nginx`) |
| 502 for api (`/api/*`) | same | api unhealthy; usually env misconfig or db unreachable |
| sites URL 404 | `docker run --rm -v dockside_site-data:/data:ro alpine ls /data` | file not in site-data (vision: did the deploy finish? did worker health-check pass?) |
| deploy → 500 | api logs during deploy | uploads volume permission (needs baked-in `mkdir + chown` in api's image) |
| prometheus target down | `:9090/targets` | that service's container down or (temp) network blip — follow its logs |
| grafana "datasource not found" | `:3030` | stale volume with legacy refs — wipe grafana-data once, provisioning rebuilds it |

## 10. Backups ingestion check (after every backup)

```bash
NEW=$(ls -1t backups/ | head -1) && (cd "backups/$NEW" && sha256sum -c manifest.sha256)
```
Every file should report `: OK`.

## 11. Git ops

- Runtime `.env` — never in git (`.gitignore`d entirely).
- Don't commit your own secrets (`.env.example` is a template only).
- Real prod secrets live only on the box's disk, `chmod 600 .env` on the VPS.

## 12. When to pause and call for help

- `--ignore-checksum` used outside the manifest-only case
- Restore returned a db with fewer users than expected
- Any 5xx in the deploy or auth flow for more than one attempt
- Grafana shows the *same* panel/problem for >1 h without the cause being identified yet
