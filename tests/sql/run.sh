#!/usr/bin/env bash
# Tests supabase/migrations/*.sql and the RLS rules on a throwaway local Postgres.
set -euo pipefail
cd "$(dirname "$0")/../.."
BIN=$(ls -d /usr/lib/postgresql/*/bin | tail -1)
DIR=$(mktemp -d); PORT=54329
trap '"$BIN/pg_ctl" -D "$DIR" stop -m fast >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT
run() { if [ "$(id -u)" = 0 ]; then chown -R postgres "$DIR"; su postgres -c "$*"; else bash -c "$*"; fi; }
run "$BIN/initdb -D $DIR -U postgres >/dev/null"
run "$BIN/pg_ctl -D $DIR -o '-p $PORT -k $DIR' -l $DIR/log start >/dev/null"
P="psql -h $DIR -p $PORT -U postgres -d postgres -v ON_ERROR_STOP=1 -q"
run "$P -f tests/sql/supabase-stub.sql"
for f in supabase/migrations/*.sql; do run "$P -f $f"; run "$P -f $f"; done   # twice: must be safe to re-run
run "$P -f tests/sql/rls-test.sql"
