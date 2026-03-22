<?php
/**
 * POST /api/notifications-seen.php
 * Mark notifications as seen for the current user (clears badge when user views the dropdown).
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../utils/cors_headers.php';
require_once __DIR__ . '/../utils/auth_helpers.php';
require_once __DIR__ . '/../utils/api_errors.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    require_session();
    $user = auth_get_user();
    $userId = (int) $user['id'];

    $mysqli = get_db_connection();
    $stmt = $mysqli->prepare('UPDATE Users SET notifications_seen_at = NOW() WHERE id = ?');
    if (!$stmt || !$stmt->bind_param('i', $userId) || !$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $stmt->close();

    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
