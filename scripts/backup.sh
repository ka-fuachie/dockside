#!/usr/bin/env bash
# Run from repo root. Off-host: rsync/scp the newest backups/<timestamp>/ dir somewhere else.
set -euo pipefail

MAX_BACKUPS=7

STAMP=$(date +%Y-%m-%d-%H%M%S)
DEST="backups/$STAMP"
mkdir -p "$DEST"

vol() { docker volume ls -q | grep -E "^dockside_site-data$|^dockside_upload-data$|^dockside_postgres_data$" | grep "$1"; }

# 1. Database
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$DEST/db.sql.gz"

# 2. Site files
SITE_VOL=$(vol site-data)
docker run --rm -v "$SITE_VOL":/data:ro -v "$PWD/$DEST":/backup alpine \
  tar czf /backup/sites.tar.gz -C /data .

UPLOAD_VOL=$(vol upload-data)
docker run --rm -v "$UPLOAD_VOL":/data:ro -v "$PWD/$DEST":/backup alpine \
  tar czf /backup/uploads.tar.gz -C /data .

# 3. Manifest
{
  echo "backup: $STAMP"
  date -u
  echo "site-data volume: $SITE_VOL"
  echo "upload-data volume: $UPLOAD_VOL"
} > "$DEST/manifest.txt"
(echo "sizes:"; du -h "$DEST"/* | sort -k2) >> "$DEST/manifest.txt"
(cd "$DEST" && sha256sum * > manifest.sha256)

# 4. Retention
ls -1dt backups/*/ | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -rf

echo "backup complete: $DEST"
