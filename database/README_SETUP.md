# Database setup (Local)

Use this schema to set up your local MySQL database.

## Credentials

| Setting    | Value |
|-----------|--------|
| **Host**  | `localhost` (when PHP runs on that server) |
| **Database** | `cse442_2026_spring_team_p_db` |
| **Username** | Your **username** (e.g. `student1`) |
| **Password** | Your **student ID / password** |

## Setup Instructions

1. Open your local MySQL client (e.g., PhpMyAdmin at `http://localhost/phpmyadmin` or the command line).
2. Create the database **`cse442_2026_spring_team_p_db`** if it doesn't already exist.
3. Import the **`database/schema.sql`** file to create the tables.
4. This creates (or replaces) the **Users**, **Reviews**, and **Collaborations** tables.

## Backend config

In **`backend/config/db_connection.php`**:

- **Username** is set to your username (e.g. `student1`).
- **Password** must be your **password** (replace the `XXXXXXXX` placeholder).
- **Database** is already set to `cse442_2026_spring_team_p_db`.

**Important:** Do not commit your real password. You can set it via environment variables locally:

- `DB_USER` – MySQL username
- `DB_PASS` – MySQL password

Set these in your Apache/PHP environment, or use `config/db_local.php`.

## Test users and dummy data

After applying the schema, seed **test users and dummy data** (demo accounts, team members, sample reviews, collaboration events) so you can log in and use the app.

- **Local:** From the project root, run `./scripts/apply-schema.sh` — it applies the schema and then runs the seed script. Use the same env if needed: `DB_USER=root DB_PASS= DB_NAME=ksg_local ./scripts/apply-schema.sh`. Or run the seed manually: `cd backend && php tools/seed_dummy_data.php` (with `DB_*` or `config/db_local.php` set).
- **Local:** From the project root, run `./scripts/apply-schema.sh` — it applies the schema and then runs the seed script. Use the same env if needed: `DB_USER=root DB_PASS= DB_NAME=ksg_local ./scripts/apply-schema.sh`. Or run the seed manually: `cd backend && php tools/seed_dummy_data.php` (with `DB_*` or `config/db_local.php` set).

Demo logins (see **`docs/DUMMY_DATA.md`**): **admin@example.com** (admin), **alex.manager@example.com** (manager), **morgan.lee.0@example.com** (employee). Password for all: **Password123!**

## After setup

- Use PhpMyAdmin anytime to inspect tables, run queries, or re-run parts of `schema.sql`.
- Your PHP app should connect correctly once the credentials in `db_connection.php` (or your local environment variables) match your local setup.
