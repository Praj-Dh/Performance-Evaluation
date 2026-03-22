<?php
/**
 * Run database/migrations/*.sql in order (001_*.sql, 002_*.sql, ...).
 * Use after apply_schema.php for fresh installs, or alone on existing DBs.
 *
 * Ignores MySQL errors that mean "already applied": duplicate column (1060),
 * duplicate table when not IF NOT EXISTS (1050), duplicate key (1062).
 *
 * Usage (from project root on server): php tools/run_migrations.php
 * Local: cd backend && php tools/run_migrations.php
 * With env: DB_USER=root DB_PASS=... DB_NAME=ksg_local php tools/run_migrations.php
 */

// Migrations dir: on server deploy layout it's ../database/migrations (tools/ and database/ are siblings).
// In repo layout it's ../../database/migrations (backend/tools/ and database/ at repo root).
$migrationsDir = __DIR__ . '/../database/migrations';
if (!is_dir($migrationsDir)) {
    $migrationsDir = __DIR__ . '/../../database/migrations';
}
if (!is_dir($migrationsDir)) {
    echo "Migrations directory not found.\n";
    exit(0);
}

$files = glob($migrationsDir . '/*.sql');
if ($files === false || count($files) === 0) {
    echo "No migration files found.\n";
    exit(0);
}
sort($files);

require_once __DIR__ . '/../config/db_connection.php';
$mysqli = get_db_connection();
if (!$mysqli) {
    fwrite(STDERR, "Database connection failed.\n");
    exit(1);
}

$ignoredErrors = [1050, 1060, 1062]; // table exists, duplicate column, duplicate key
$run = 0;
$skipped = 0;

foreach ($files as $path) {
    $name = basename($path);
    $sql = file_get_contents($path);
    if ($sql === false || trim($sql) === '') {
        continue;
    }

    try {
        if (!$mysqli->multi_query($sql)) {
            $errno = $mysqli->errno;
            $error = $mysqli->error;
            if (in_array($errno, $ignoredErrors, true)) {
                echo "  [skip] {$name} (already applied: {$error})\n";
                $skipped++;
                while ($mysqli->more_results() && $mysqli->next_result()) {
                    // flush
                }
                continue;
            }
            fwrite(STDERR, "Migration failed: {$name} - [{$errno}] {$error}\n");
            exit(1);
        }

        while ($mysqli->more_results() && $mysqli->next_result()) {
            if ($mysqli->error && !in_array($mysqli->errno, $ignoredErrors, true)) {
                fwrite(STDERR, "Migration failed: {$name} - [{$mysqli->errno}] {$mysqli->error}\n");
                exit(1);
            }
        }
    } catch (mysqli_sql_exception $e) {
        $errno = (int) $e->getCode();
        if (in_array($errno, $ignoredErrors, true)) {
            echo "  [skip] {$name} (already applied: {$e->getMessage()})\n";
            $skipped++;
            continue;
        }
        fwrite(STDERR, "Migration failed: {$name} - [{$errno}] {$e->getMessage()}\n");
        exit(1);
    }
    echo "  [ok] {$name}\n";
    $run++;
}

echo "Migrations: {$run} applied, {$skipped} skipped (already applied).\n";
