#!/usr/bin/env bash
#
# Apply database/schema.sql to the configured MySQL database.
# Usage (local dev):
#   DB_USER=root DB_PASS= DB_NAME=ksg_local ./scripts/apply-schema.sh
#
# This is also invoked automatically by ./scripts/dev.sh so that
# your local schema stays in sync with database/schema.sql.
#

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMA_FILE="$ROOT/database/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Schema file not found: $SCHEMA_FILE"
  exit 1
fi

if ! command -v mysql >/dev/null 2>&1; then
  echo "mysql client not found on PATH. Install MySQL client to apply schema."
  exit 0
fi

DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
DB_NAME="${DB_NAME:-ksg_local}"

echo "Applying schema to MySQL database '${DB_NAME}' on ${DB_HOST} as ${DB_USER}..."

if [ -n "$DB_PASS" ]; then
  mysql -h "$DB_HOST" -u "$DB_USER" "-p${DB_PASS}" "$DB_NAME" < "$SCHEMA_FILE"
else
  mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < "$SCHEMA_FILE"
fi

echo "Schema applied successfully."

# Run migrations (idempotent; skips already-applied changes)
if command -v php >/dev/null 2>&1; then
  echo "Running database migrations..."
  (cd "$ROOT/backend" && env DB_HOST="$DB_HOST" DB_USER="$DB_USER" DB_PASS="$DB_PASS" DB_NAME="$DB_NAME" php tools/run_migrations.php) || true
fi

# Seed test users and dummy data (idempotent)
if command -v php >/dev/null 2>&1; then
  echo "Seeding test users and dummy data..."
  (cd "$ROOT/backend" && env DB_HOST="$DB_HOST" DB_USER="$DB_USER" DB_PASS="$DB_PASS" DB_NAME="$DB_NAME" php tools/seed_dummy_data.php) && echo "Dummy data seeded." || echo "Warning: seed failed. Check backend/config/db_local.php or DB_* and run: cd backend && php tools/seed_dummy_data.php"
else
  echo "PHP not found. To add test users and dummy data, run: cd backend && php tools/seed_dummy_data.php"
fi

