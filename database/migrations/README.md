# Database migrations

Migrations run **automatically**:

- **Local dev:** `./scripts/dev.sh` and `./scripts/apply-schema.sh` run `schema.sql` then `tools/run_migrations.php` (then seed).

Run these **only on existing databases** that were created before the schema change. New installs use the main `database/schema.sql` (which already includes `Users.role`, `PasswordResetTokens`, `email_verified_at`, `EmailVerificationOtps`, and `PasswordResetOtps`). The runner ignores "duplicate column" / "table exists" so re-running is safe.

- **001_sprint2_auth.sql** – Adds `role` to `Users` and creates `PasswordResetTokens`.
- **002_email_verification_and_reset_otp.sql** – Adds `email_verified_at` to `Users`, creates `EmailVerificationOtps` and `PasswordResetOtps`, and backfills existing users as verified.
