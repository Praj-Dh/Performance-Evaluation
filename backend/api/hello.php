<?php
/**
 * GET /api/hello.php
 * Simple Hello World endpoint that verifies DB connectivity and returns JSON.
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

    // Touch the database so this endpoint also proves DB connectivity.
    $mysqli = get_db_connection();
    $result = $mysqli->query('SELECT 1 AS ok');
    $row = $result ? $result->fetch_assoc() : null;

    echo json_encode([
        'message' => 'Hello World',
        'db_ok' => $row !== null && (int) $row['ok'] === 1,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

