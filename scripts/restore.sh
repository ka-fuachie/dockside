#!/usr/bin/env bash
# Usage: scripts/restore.sh 2026-10-19-1812
# Assumes a CLEAN state (volumes gone or wiped). Stop services that read/write the volumes first.
set -euo pipefail

STAMP="${1:?usage: restore.sh <timestamp dir under backups/>}"
SRC="backups/$STAMP"
[ -d "$SRC" ] || { echo "no such backup dir: $SRC"; exit 1; }

echo "== verify checksums"
IGNORE_CHECKSUM="${2:?usage: restore.sh <stamp> [--ignore-checksum]}"
if [ "$IGNORE_CHECKSUM" = "--ignore-checksum" ]; then
  echo "checksum gate disabled by flag; proceeding without verification"
elif (cd "$SRC" && sha256sum -c manifest.sha256); then
  echo "checksums OK"
else
  (cd "$SRC" && sha256sum -c manifest.sha256 2>&1 | grep -v ": OK\|^sha256sum\|WARNING" || true)
  echo ""
  echo "checksums FAILED (see above)."
  echo "If ONLY manifest.txt is listed, it's the known benign case (manifest hashed after a script edit)."
  echo "You may retry with: scripts/restore.sh $STAMP --ignore-checksum"
  exit 1
fi

echo "== stop writers (worker, api, web); nginx can stay"
docker compose up -d db
docker compose rm -sf worker api web

echo "== db: wipe schema, import dump"
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
gunzip -c "$SRC/db.sql.gz" | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

echo "== site-data"
SITE_VOL=$(docker volume ls -q | grep -E "site-data$")
docker run --rm -i -v "$SITE_VOL":/data alpine sh -c 'cd /data && rm -rf ./* && tar xz' < "$SRC/sites.tar.gz"

echo "== upload-data"
UPLOAD_VOL=$(docker volume ls -q | grep -E "upload-data$")
docker run --rm -i -v "$UPLOAD_VOL":/data alpine sh -c 'cd /data && rm -rf ./* && tar xz' < "$SRC/uploads.tar.gz"

echo "== bring stack back"
docker compose -f docker-compose.yml -f compose.prod.yml up -d

echo "restore complete from $STAMP"
