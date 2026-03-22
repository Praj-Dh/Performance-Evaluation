<?php
/**
 * GET /api/health.php
 *
 * Simple health-check endpoint to verify:
 * - PHP backend is running
 * - Database connection works
 * - Core tables (Users, TeamMembers) are reachable
 *
 * The frontend can call this route to confirm end-to-end connectivity.
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../utils/cors_headers.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $dbConnected = false;
    $usersTableOk = false;
    $teamMembersTableOk = false;

    // Check DB connectivity
    $mysqli = get_db_connection();
    if ($mysqli && !$mysqli->connect_errno) {
        $dbConnected = true;

        // Check that core tables exist by running lightweight queries.
        // Suppress errors per-table so one missing table doesn't crash the whole health check.
        if ($result = @$mysqli->query('SELECT 1 FROM Users LIMIT 1')) {
            $usersTableOk = true;
            $result->close();
        }
        if ($result = @$mysqli->query('SELECT 1 FROM TeamMembers LIMIT 1')) {
            $teamMembersTableOk = true;
            $result->close();
        }
    }

    echo json_encode([
        'status' => ($dbConnected ? 'ok' : 'degraded'),
        'backend_ok' => true,
        'db' => [
            'connected' => $dbConnected,
            'users_table_ok' => $usersTableOk,
            'team_members_table_ok' => $teamMembersTableOk,
        ],
        'timestamp' => gmdate('c'),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'backend_ok' => false,
        'db' => [
            'connected' => false,
            'users_table_ok' => false,
            'team_members_table_ok' => false,
        ],
        'error' => $e->getMessage(),
        'timestamp' => gmdate('c'),
    ]);
}

