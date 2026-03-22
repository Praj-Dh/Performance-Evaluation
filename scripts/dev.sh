#!/usr/bin/env bash
# Run backend, frontend, and ensure MySQL for local dev. Logs from both servers are shown.
# Usage: ./scripts/dev.sh   (run from project root)
# Stop: Ctrl+C

set -e
# Ensure Homebrew (and thus php) is on PATH when script is run from IDE or non-interactive shell
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
[ -f "$HOME/.zprofile" ] && source "$HOME/.zprofile" 2>/dev/null || true
[ -f "$HOME/.bash_profile" ] && source "$HOME/.bash_profile" 2>/dev/null || true

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export APP_ENV="${APP_ENV:-dev}"
export SKIP_EMAIL_VERIFICATION="${SKIP_EMAIL_VERIFICATION:-1}"
LOG_DIR="$ROOT/.dev-logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
: > "$BACKEND_LOG"
: > "$FRONTEND_LOG"

cleanup() {
  echo ""
  echo "Stopping servers..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID" 2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

# 1) Ensure MySQL is running (Mac Homebrew)
if command -v brew &>/dev/null; then
  echo "Ensuring MySQL is running..."
  brew services start mysql 2>/dev/null || true
  sleep 1
fi

# 2) Apply database schema, migrations, and seed dummy data (optional)
echo "Applying schema + migrations to local MySQL (if mysql client available)..."
(
  # Use the same defaults that the backend uses for local dev
  export DB_USER="${DB_USER:-root}"
  export DB_PASS="${DB_PASS:-}"
  export DB_NAME="${DB_NAME:-ksg_local}"
  "$ROOT/scripts/apply-schema.sh" || true
)

echo "Seeding dummy data (demo user, team members, sample review)..."
(
  cd "$ROOT/backend"
  # Reuse the same DB_* defaults used for local dev so seeding targets
  # the same database as apply-schema and the running backend.
  env DB_USER="${DB_USER:-root}" DB_PASS="${DB_PASS:-}" DB_NAME="${DB_NAME:-ksg_local}" \
    php tools/seed_dummy_data.php 2>/dev/null || true
)

# 3) Start PHP backend
if ! command -v php &>/dev/null; then
  echo "PHP not found. Install with: brew install php"
  exit 1
fi
echo "Starting backend (PHP) on http://localhost:8080 ..."
(
  cd "$ROOT/backend"
  exec env APP_ENV="${APP_ENV}" SKIP_EMAIL_VERIFICATION="${SKIP_EMAIL_VERIFICATION}" DB_USER="${DB_USER:-root}" DB_PASS="${DB_PASS:-}" DB_NAME="${DB_NAME:-ksg_local}" \
    php -S localhost:8080 >> "$BACKEND_LOG" 2>&1
) &
BACKEND_PID=$!
sleep 1
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  echo "Backend failed to start. Check $BACKEND_LOG"
  cat "$BACKEND_LOG"
  exit 1
fi

# 4) Start Next.js frontend
echo "Starting frontend (Next.js) on http://localhost:3000 ..."
(
  cd "$ROOT/frontend"
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:8080}"
  exec npm run dev >> "$FRONTEND_LOG" 2>&1
) &
FRONTEND_PID=$!
sleep 2
if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
  echo "Frontend failed to start. Check $FRONTEND_LOG"
  cat "$FRONTEND_LOG"
  kill "$BACKEND_PID" 2>/dev/null || true
  exit 1
fi

echo ""
echo "  Backend:  http://localhost:8080"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Logs (Ctrl+C to stop all):"
echo "---"
tail -f "$BACKEND_LOG" "$FRONTEND_LOG"
