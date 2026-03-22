# Dummy data (seed)

This document describes the test data created by **`backend/tools/seed_dummy_data.php`**. Use it for local development and testing.

## Company

- **Company:** Northwind Labs  
- **Domain:** `example.com`  
- **Password (all accounts):** `Password123!`  
- **Email verification:** All seeded accounts are **auto-verified**; no verification step is required to sign in.

---

## How to seed

From the project root (with DB config set, e.g. `backend/config/db_connection.php` or env `DB_*`):

```bash
cd backend && php tools/seed_dummy_data.php
```

Or use `./scripts/apply-schema.sh`, which applies the schema and then runs the seed.

The script is **idempotent**: it skips or updates existing rows instead of duplicating them.

---

## Accounts overview

| Type      | Count | Notes                          |
|-----------|-------|--------------------------------|
| Admin     | 1     | Full admin + user/team management |
| Managers  | 4     | Lead one or two teams each     |
| Employees | 19    | Assigned to one team each      |
| **Total users** | **24** | All `*@example.com`        |
| **Teams** | **7** | Engineering, Product, Design, People Ops, Support, Operations, QA |

---

## Admin

| Email             | Display name | Role  |
|-------------------|-------------|-------|
| `admin@example.com` | Admin User  | admin |

Use this account to access the **Admin** page (link on the login page or “Admin” in the sidebar). From there you can manage users, teams, and team members.

---

## Managers (and teams they lead)

| Email                  | Display name   | Role    | Team(s) led        |
|------------------------|----------------|---------|--------------------|
| `alex.manager@example.com`  | Alex Chen      | manager | Engineering         |
| `jordan.manager@example.com`| Jordan Blake   | manager | Product, Design     |
| `priya.manager@example.com` | Priya Sharma   | manager | People Ops, Support |
| `sam.manager@example.com`   | Sam Rivera     | manager | Operations, QA      |

---

## Teams

| Team        | Department  | Lead manager |
|-------------|-------------|--------------|
| Engineering | Engineering | Alex Chen    |
| Product     | Product     | Jordan Blake |
| Design      | Design      | Jordan Blake |
| People Ops  | People Ops  | Priya Sharma |
| Support     | Support     | Priya Sharma |
| Operations  | Operations  | Sam Rivera   |
| QA          | QA          | Sam Rivera   |

---

## Employees (by team)

Employee emails follow the pattern `{firstlast}.{index}@example.com` (e.g. `morgan.lee.0@example.com`). All use password **`Password123!`**.

### Engineering (4)

| Name        | Job title              | Email (pattern)   |
|-------------|------------------------|-------------------|
| Morgan Lee  | Software Engineer      | morgan.lee.0@example.com |
| Casey Kim   | Senior Software Engineer | casey.kim.1@example.com |
| Riley Jones | DevOps Engineer       | riley.jones.2@example.com |
| Quinn Davis | Software Engineer      | quinn.davis.3@example.com |

### Product (3)

| Name          | Job title                 | Email (pattern)     |
|---------------|----------------------------|---------------------|
| Avery Wilson  | Product Manager            | avery.wilson.4@example.com |
| Taylor Brown  | Product Analyst            | taylor.brown.5@example.com |
| Skyler Moore  | Associate Product Manager  | skyler.moore.6@example.com |

### Design (3)

| Name           | Job title             | Email (pattern)      |
|----------------|------------------------|----------------------|
| Jamie Taylor   | Product Designer       | jamie.taylor.7@example.com |
| Drew Anderson  | UX Designer           | drew.anderson.8@example.com |
| Jordan UX      | Senior Product Designer | jordan.ux.9@example.com |

### People Ops (2)

| Name          | Job title                 | Email (pattern)        |
|---------------|----------------------------|------------------------|
| Morgan Hill   | People Operations Analyst  | morgan.hill.10@example.com |
| Cameron Clark | HR Specialist              | cameron.clark.11@example.com |

### Support (3)

| Name          | Job title                    | Email (pattern)        |
|---------------|-------------------------------|------------------------|
| Reese Lewis   | Support Engineer              | reese.lewis.12@example.com |
| Sage Walker   | Customer Success Specialist   | sage.walker.13@example.com |
| Finley Hall   | Support Lead                  | finley.hall.14@example.com |

### Operations (1)

| Name         | Job title             | Email (pattern)       |
|--------------|------------------------|------------------------|
| Emery Young  | Operations Coordinator | emery.young.15@example.com |

### QA (3)

| Name          | Job title                | Email (pattern)        |
|---------------|---------------------------|------------------------|
| Parker King   | QA Engineer               | parker.king.16@example.com |
| Blake Wright  | QA Analyst                | blake.wright.17@example.com |
| Hayden Scott  | Test Automation Engineer   | hayden.scott.18@example.com |

---

## Sample reviews and events

- **Morgan Lee** (first employee) has two reviews: “Annual Performance Review” (5) and “Mid-Year Check-in” (4).
- **Alex Chen** (Engineering Manager) has one review: “Leadership 360 Review” (4).
- **Morgan Lee** has two collaboration events: “Onboarding mentorship for new hire” (mentorship) and “Knowledge share: Performance dashboards” (knowledge).

These exist so you can test reviews, trends, and collaboration logs without creating data manually.

---

## Quick reference: logins

| Purpose     | Email                     | Password     |
|------------|---------------------------|--------------|
| Admin      | `admin@example.com`        | `Password123!` |
| Manager    | `alex.manager@example.com`  | `Password123!` |
| Employee   | `morgan.lee.0@example.com` | `Password123!` |

Any other seeded user above uses the same password.
