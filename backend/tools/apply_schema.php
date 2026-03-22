<?php
/**
 * Apply database/schema.sql on the TEST server.
 *
 * This script is intended to be run on local via:
 *   php /data/web/CSE442/2026-Spring/cse-442p/tools/apply_schema.php
 *
 * It uses the same connection logic as the rest of the backend (db_connection.php),
 * which in turn prefers config/db_local.php when present.
 */

require_once __DIR__ . '/../config/db_connection.php';

// Path where deploy script places the schema file on the server.
$schemaPath = __DIR__ . '/../database/schema.sql';

if (!file_exists($schemaPath)) {
    fwrite(STDERR, "Schema file not found at {$schemaPath}\n");
    exit(1);
}

$sql = file_get_contents($schemaPath);
if ($sql === false) {
    fwrite(STDERR, "Failed to read schema file.\n");
    exit(1);
}

$mysqli = get_db_connection();

if (!$mysqli) {
    fwrite(STDERR, "Database connection failed.\n");
    exit(1);
}

if (!$mysqli->multi_query($sql)) {
    fwrite(STDERR, "Error applying schema: " . $mysqli->error . "\n");
    exit(1);
}

// Flush remaining results, if any.
while ($mysqli->more_results() && $mysqli->next_result()) {
    // no-op
}

echo "Schema applied successfully.\n";

