#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
EMPLOYEE_EMAIL="${EMPLOYEE_EMAIL:-morgan.lee.0@example.com}"
EMPLOYEE_PASSWORD="${EMPLOYEE_PASSWORD:-Password123!}"
TEST_DATE="${TEST_DATE:-$(date +%Y-%m-15)}"
TEST_MONTH="${TEST_MONTH:-${TEST_DATE:0:7}}"

COOKIE_JAR="$(mktemp)"
BODY_FILE="$(mktemp)"
trap 'rm -f "$COOKIE_JAR" "$BODY_FILE"' EXIT

STATUS=""

log() {
  printf '%s\n' "$*"
}

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

pass() {
  printf 'PASS: %s\n' "$*"
}

request() {
  local method="$1"
  local url="$2"
  local data="${3:-}"

  if [[ -n "$data" ]]; then
    STATUS="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' \
      -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
      -X "$method" "$url" \
      -H 'Content-Type: application/json' \
      --data "$data")"
  else
    STATUS="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' \
      -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
      -X "$method" "$url")"
  fi
}

assert_status() {
  local expected="$1"
  local label="$2"
  if [[ "$STATUS" != "$expected" ]]; then
    log "Response body:"
    cat "$BODY_FILE" || true
    fail "$label (expected HTTP $expected, got $STATUS)"
  fi
  pass "$label"
}

assert_contains() {
  local needle="$1"
  local label="$2"
  if ! grep -Fq "$needle" "$BODY_FILE"; then
    log "Response body excerpt (first 400 chars):"
    head -c 400 "$BODY_FILE" || true
    printf '\n'
    fail "$label (missing: $needle)"
  fi
  pass "$label"
}

assert_not_contains_regex() {
  local regex="$1"
  local label="$2"
  if grep -Eiq "$regex" "$BODY_FILE"; then
    log "Response body excerpt (first 400 chars):"
    head -c 400 "$BODY_FILE" || true
    printf '\n'
    fail "$label (found forbidden pattern: $regex)"
  fi
  pass "$label"
}

assert_jq_true() {
  local jq_expr="$1"
  local label="$2"
  if ! jq -e "$jq_expr" "$BODY_FILE" >/dev/null 2>&1; then
    log "Response body:"
    cat "$BODY_FILE" || true
    fail "$label (jq assertion failed: $jq_expr)"
  fi
  pass "$label"
}

log "=== Peers + Shared Calendar backend checks via curl ==="
log "BASE_URL=$BASE_URL"
log "TEST_DATE=$TEST_DATE"
log "TEST_MONTH=$TEST_MONTH"

log "\n[Test 1] Navigate to Peers and verify Shared Calendar render contract"
request POST "$BASE_URL/api/login.php" "{\"email\":\"$EMPLOYEE_EMAIL\",\"password\":\"$EMPLOYEE_PASSWORD\"}"
assert_status 200 "Login succeeds"
assert_jq_true '.success == true and .user.role == "employee"' "Login payload has employee session"

request GET "$BASE_URL/api/me.php"
assert_status 200 "Session user endpoint is healthy"
assert_jq_true '.user.role == "employee"' "Session user remains employee"

request GET "$BASE_URL/peers/"
assert_status 200 "Peers route responds"
assert_contains "Shared Calendar" "Peers HTML includes Shared Calendar heading"
assert_contains "Highlight important dates" "Peers HTML includes Highlight important dates card"
assert_contains "Comment on a date" "Peers HTML includes Comment on a date card"
assert_contains "Review team context" "Peers HTML includes Review team context card"
if ! grep -Fq "‹" "$BODY_FILE" && ! grep -Fq "&lsaquo;" "$BODY_FILE" && ! grep -Fq "Previous month" "$BODY_FILE"; then
  fail "Peers HTML includes previous-month navigation indicator"
fi
pass "Peers HTML includes previous-month navigation indicator"
if ! grep -Fq "›" "$BODY_FILE" && ! grep -Fq "&rsaquo;" "$BODY_FILE" && ! grep -Fq "Next month" "$BODY_FILE"; then
  fail "Peers HTML includes next-month navigation indicator"
fi
pass "Peers HTML includes next-month navigation indicator"
assert_not_contains_regex 'application error|uncaught|exception|stack trace' "Peers HTML has no fatal error signature"

request GET "$BASE_URL/api/shared-calendar.php?month=$TEST_MONTH"
assert_status 200 "Shared calendar API month payload available"
assert_jq_true '.section_title == "Shared Calendar"' "Shared calendar section title matches"
assert_jq_true '.task_cards.highlight_important_dates == "Highlight important dates" and .task_cards.comment_on_a_date == "Comment on a date" and .task_cards.review_team_context == "Review team context"' "Shared calendar task cards match"
assert_jq_true '.days | type == "array" and length >= 28' "Shared calendar exposes date grid"
assert_jq_true '[.days[] | select(.is_selectable == true)] | length > 0' "Shared calendar has selectable dates"

log "\n[Test 2] Mark important date and verify persistence"
request POST "$BASE_URL/api/shared-calendar.php" "{\"date\":\"$TEST_DATE\",\"important\":true}"
assert_status 200 "Mark important request accepted"
assert_jq_true '.success == true' "Mark important response success=true"

request GET "$BASE_URL/api/shared-calendar.php?month=$TEST_MONTH"
assert_status 200 "Refresh month after mark"
assert_jq_true "[.days[] | select(.date == \"$TEST_DATE\")] | length == 1" "Target date appears once in grid"
assert_jq_true "[.days[] | select(.date == \"$TEST_DATE\" and .is_important == true)] | length == 1" "Target date remains marked important"

request POST "$BASE_URL/api/shared-calendar.php" "{\"date\":\"$TEST_DATE\",\"important\":false}"
assert_status 200 "Unmark important request accepted"
assert_jq_true '.success == true' "Unmark important response success=true"

request GET "$BASE_URL/api/shared-calendar.php?month=$TEST_MONTH"
assert_status 200 "Refresh month after unmark"
assert_jq_true "[.days[] | select(.date == \"$TEST_DATE\" and .is_important == true)] | length == 0" "Important indicator removed after refresh"

log "\n[Test 3] Add/remove comment and reject blank comment"
COMMENT_TEXT="Team meeting preparation $(date +%s)"
request POST "$BASE_URL/api/calendar-comments.php" "{\"date\":\"$TEST_DATE\",\"comment\":\"$COMMENT_TEXT\"}"
assert_status 200 "Add comment request accepted"
assert_jq_true '.success == true and (.comment.id | tonumber) > 0' "Comment creation returns id"
COMMENT_ID="$(jq -r '.comment.id' "$BODY_FILE")"

request GET "$BASE_URL/api/calendar-comments.php?date=$TEST_DATE"
assert_status 200 "Fetch comments for date"
assert_jq_true "[.comments[] | select(.id == $COMMENT_ID and .comment == \"$COMMENT_TEXT\")] | length == 1" "Added comment persists"
assert_jq_true "[.comments[] | select(.id == $COMMENT_ID and (.author_name|length) > 0 and (.created_at|length) > 0)] | length == 1" "Comment metadata (author/timestamp) present"

request DELETE "$BASE_URL/api/calendar-comments.php?comment_id=$COMMENT_ID"
assert_status 200 "Delete comment request accepted"
assert_jq_true '.success == true' "Delete comment response success=true"

request GET "$BASE_URL/api/calendar-comments.php?date=$TEST_DATE"
assert_status 200 "Fetch comments after deletion"
assert_jq_true "[.comments[] | select(.id == $COMMENT_ID)] | length == 0" "Deleted comment no longer present"

request POST "$BASE_URL/api/calendar-comments.php" "{\"date\":\"$TEST_DATE\",\"comment\":\"   \"}"
assert_status 400 "Blank comment rejected"
assert_jq_true '.error | test("empty|blank|required"; "i")' "Blank comment validation message returned"

log "\n[Test 4] Dashboard route health (logo target destination)"
request GET "$BASE_URL/dashboard/"
assert_status 200 "Dashboard route responds"
if ! grep -Eiq 'My Dashboard|Team Dashboard|Dashboard' "$BODY_FILE"; then
  fail "Dashboard HTML contains dashboard label"
fi
pass "Dashboard HTML contains dashboard label"
assert_not_contains_regex 'application error|uncaught|exception|stack trace' "Dashboard HTML has no fatal route error"

request GET "$BASE_URL/api/me.php"
assert_status 200 "Session still valid on dashboard"

request POST "$BASE_URL/api/logout.php"
assert_status 200 "Logout succeeds"
assert_jq_true '.success == true' "Logout payload success=true"

log "\nAll curl backend checks completed."
