# Postman API Test Cases: Employee Dashboard Flows

**Test server link:** http://localhost:8080/

Use seeded credentials from [DUMMY_DATA.md](DUMMY_DATA.md): password for all is **Password123!**

- **Primary employee (has activity):** `morgan.lee.0@example.com`
- **Empty-state employee (no activity expected):** `hayden.scott.18@example.com`

Collection + environment files:

- [docs/postman/EMPLOYEE_DASHBOARD_API_TESTS.postman_collection.json](postman/EMPLOYEE_DASHBOARD_API_TESTS.postman_collection.json)
- [docs/postman/EMPLOYEE_DASHBOARD_API_TESTS.postman_environment.json](postman/EMPLOYEE_DASHBOARD_API_TESTS.postman_environment.json)

---

## How to run

1. Import both Postman files above.
2. Select environment **CSE442 Employee Dashboard API (TEST)**.
3. Run the collection folder-by-folder in order (**Test 1** to **Test 5**) so session/auth state follows the intended flow.
4. Keep the default base URL unless testing another deployment.

---

## Test 1: Employee Dashboard loads with navigation and widgets (API coverage)

**Goal:** Validate the API data dependencies used by Employee Dashboard bootstrap.

Requests in folder:

1. **1.1 Login as employee** (`POST /api/login.php`)
2. **1.2 Validate current session user** (`GET /api/me.php`)
3. **1.3 Load collaboration activity feed data** (`GET /api/collaboration-log.php`)
4. **1.4 Load review summary data** (`GET /api/reviews.php`)

Assertions covered:

- Employee login succeeds and session user is role `employee`
- Protected `me` endpoint returns authenticated user context
- Collaboration feed returns valid event structure for dashboard widgets
- Review summary returns stable counts and numeric/null average score

---

## Test 2: Log Event button navigates to Log Collaboration Event page (API coverage)

**Goal:** Validate API backing for Log Collaboration Event form behavior.

Requests in folder:

1. **2.1 Load peers list for tagging** (`GET /api/peers.php`)
2. **2.2 Submit collaboration event** (`POST /api/collaboration-log.php`)
3. **2.3 Verify created event appears in history** (`GET /api/collaboration-log.php`)
4. **2.4 Reject event when title is missing** (`POST /api/collaboration-log.php`)

Assertions covered:

- Peer selector data shape is valid
- Valid event submission returns `success: true` and an event id
- Newly created event is retrievable via history API
- Validation guards reject missing required title

---

## Test 3: Recent Activity “View All” navigates to collaboration history (API coverage)

**Goal:** Validate collaboration history payload for list/table rendering.

Request in folder:

1. **3.1 Validate collaboration history list and sort order** (`GET /api/collaboration-log.php`)

Assertions covered:

- History endpoint returns records for active seeded employee
- Each record exposes title, event type, date, and description
- Records are sorted by `event_date DESC`, then `created_at DESC`

---

## Test 4: “This Week at a Glance” shows numeric value and comparison indicator (API coverage)

**Goal:** Ensure week metrics computed from API data remain numeric and safe.

Request in folder:

1. **4.1 Compute weekly activity and comparison indicator** (`GET /api/collaboration-log.php`)

Assertions covered:

- Current-week submitted activity count is numeric and not `NaN`
- Week-over-week comparison value is numeric and not `NaN`
- Stored computed values are non-negative and stable

---

## Test 5: Dashboard shows empty state when employee has no activity (API coverage)

**Goal:** Validate empty-data behavior for collaboration activity sources.

Requests in folder:

1. **5.1 Login as empty-state employee** (`POST /api/login.php`)
2. **5.2 Get activity feed (expect empty)** (`GET /api/collaboration-log.php`)
3. **5.3 Verify empty-state metrics stay numeric** (`GET /api/collaboration-log.php`)
4. **5.4 Logout** (`POST /api/logout.php`)

Assertions covered:

- Empty-state employee can authenticate
- Collaboration feed returns `events: []`
- Computed empty-state metrics remain numeric and valid
- Session cleanup works via logout

---

## Summary Table

| Test | Purpose |
|------|--------|
| 1 | Session bootstrap and dashboard data dependencies (me, collaboration feed, reviews). |
| 2 | Log Event form support data, submit path, and validation behavior. |
| 3 | Collaboration history payload completeness and sort behavior. |
| 4 | Week metric/comparison numeric integrity (no NaN/invalid values). |
| 5 | Empty-state API behavior for employees with no collaboration activity. |
