#!/usr/bin/env bash
# Banco de teste local (Postgres puro, sem Docker) com o schema do TMS + o do app,
# e roda os testes pgTAP dos dois repositórios. Não toca no projeto hospedado.
#
# Uso: TMS_DIR=../ngs_transportes supabase/tests/local/run.sh
# Requer: Postgres 16+ com pgTAP (pg_prove) e um servidor em $PGHOST:$PGPORT.
set -euo pipefail
shopt -s nullglob

APP_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
TMS_DIR="${TMS_DIR:-$APP_DIR/../ngs_transportes}"
DB="${TEST_DB:-app_motorista_test}"
export PGHOST="${PGHOST:-/tmp/pgtest}" PGPORT="${PGPORT:-54329}" PGUSER="${PGUSER:-postgres}"
PSQL=(psql -q -v ON_ERROR_STOP=1 -d "$DB")

[ -d "$TMS_DIR/supabase/migrations" ] || { echo "TMS_DIR sem supabase/migrations: $TMS_DIR" >&2; exit 1; }

psql -q -d postgres -c "drop database if exists $DB with (force)" -c "create database $DB"
psql -q -d "$DB" -c "alter database $DB set search_path = \"\$user\", public, extensions"
"${PSQL[@]}" -f "$APP_DIR/supabase/tests/local/00_supabase_stub.sql"

aplicar() {  # $1 = arquivo de migration
  local sql
  sql="$(cat "$1")"
  # O hospedado roda Postgres 17; MAINTAIN só existe a partir do 17.
  if [ "$(psql -tA -d "$DB" -c 'show server_version_num')" -lt 170000 ]; then
    sql="${sql//, maintain,/,}"
  fi
  printf '%s\n' "$sql" | "${PSQL[@]}" -f - >/dev/null
  local base; base="$(basename "$1" .sql)"
  "${PSQL[@]}" -c "insert into supabase_migrations.schema_migrations(version, name) values ('${base%%_*}', '${base#*_}')"
}

echo "== migrations do TMS ($TMS_DIR)"
for f in "$TMS_DIR"/supabase/migrations/*.sql; do aplicar "$f"; done
if [ -f "$TMS_DIR/supabase/seed.sql" ]; then
  echo "== seed do TMS (alguns testes do TMS dependem dele, como no \`supabase test db\`)"
  "${PSQL[@]}" -f "$TMS_DIR/supabase/seed.sql" >/dev/null
fi
echo "== migrations do app"
for f in "$APP_DIR"/supabase/migrations/*.sql; do echo "   $(basename "$f")"; aplicar "$f"; done

echo "== pgTAP do app"
APP_TESTES=("$APP_DIR"/supabase/tests/database/*.test.sql)
[ ${#APP_TESTES[@]} -eq 0 ] || pg_prove -d "$DB" "${APP_TESTES[@]}"
if [ "${COM_TESTES_TMS:-1}" = "1" ]; then
  echo "== pgTAP do TMS (regressão: o app não pode quebrar o TMS)"
  pg_prove -d "$DB" "$TMS_DIR"/supabase/tests/database/*.test.sql
fi
