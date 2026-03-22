# Postman + curl Backend Schema: Peers and Shared Calendar Tests

**Target app URL:** http://localhost:8080/

This package lets you run your 4 desktop scenarios as backend-driven checks.

## Files

- OpenAPI contract: [docs/postman/PEERS_CALENDAR_BACKEND_CONTRACT.openapi.yaml](postman/PEERS_CALENDAR_BACKEND_CONTRACT.openapi.yaml)
- Postman collection: [docs/postman/PEERS_CALENDAR_BACKEND_TESTS.postman_collection.json](postman/PEERS_CALENDAR_BACKEND_TESTS.postman_collection.json)
- Postman environment: [docs/postman/PEERS_CALENDAR_BACKEND_TESTS.postman_environment.json](postman/PEERS_CALENDAR_BACKEND_TESTS.postman_environment.json)
- curl runner: [scripts/curl/run_peers_calendar_backend_tests.sh](/Users/sujalbhakare/Projects/s26-fantastic-5/scripts/curl/run_peers_calendar_backend_tests.sh)

## Important note

The current repo implements auth/session endpoints (`/api/login.php`, `/api/me.php`, `/api/logout.php`) and route checks (`/peers/`, `/dashboard/`), but does **not** currently include these calendar contract endpoints:

- `GET/POST /api/shared-calendar.php`
- `GET/POST/DELETE /api/calendar-comments.php`

If these endpoints are missing on the deployed backend, Task 2 and Task 3 checks will fail with `404` until implemented.

## Run with Postman

1. Import the collection and environment files.
2. Select environment **Peers Calendar Backend Tests (local)**.
3. Run folders in order:
   - `Test 1 - Peers page + Shared Calendar render`
   - `Test 2 - Mark/unmark important date persistence`
   - `Test 3 - Add/remove comments and blank validation`
   - `Test 4 - Dashboard route health (logo target)`

## Run with curl

From repo root:

```bash
./scripts/curl/run_peers_calendar_backend_tests.sh
```

Optional overrides:

```bash
BASE_URL="http://localhost:8080" \
EMPLOYEE_EMAIL="morgan.lee.0@example.com" \
EMPLOYEE_PASSWORD="Password123!" \
TEST_DATE="2026-03-18" \
TEST_MONTH="2026-03" \
./scripts/curl/run_peers_calendar_backend_tests.sh
```

## Task mapping

### Task Test 1: Navigate to Peers page and verify Shared Calendar renders

- Login/session: `POST /api/login.php`, `GET /api/me.php`
- Route check: `GET /peers/`
- Shared calendar contract payload: `GET /api/shared-calendar.php?month=YYYY-MM`

### Task Test 2: Mark important date and verify persistence

- Mark: `POST /api/shared-calendar.php` with `{ "date": "YYYY-MM-DD", "important": true }`
- Persistence check: `GET /api/shared-calendar.php?month=YYYY-MM`
- Unmark: `POST /api/shared-calendar.php` with `{ "important": false }`

### Task Test 3: Add/remove date comment and validate blank comment rejection

- Add: `POST /api/calendar-comments.php`
- Persist check: `GET /api/calendar-comments.php?date=YYYY-MM-DD`
- Delete: `DELETE /api/calendar-comments.php?comment_id=...`
- Blank validation: `POST /api/calendar-comments.php` with blank-only comment must return `400`

### Task Test 4: Logo navigation redirects to dashboard

- Backend-only proxy check for logo target page health:
  - `GET /dashboard/`
  - `GET /api/me.php` (session still valid)

