<?php
/**
 * PATCH /api/update-profile.php
 * Body: { "display_name": "..." } — optional. Updates current user's profile.
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../utils/cors_headers.php';
require_once __DIR__ . '/../utils/auth_helpers.php';
require_once __DIR__ . '/../utils/api_errors.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'PATCH' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    require_session();
    $user_id = (int) $_SESSION['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);
    $raw = isset($data['display_name']) ? trim($data['display_name']) : null;
    if ($raw === null) {
        echo json_encode(['success' => true, 'message' => 'Nothing to update']);
        return;
    }
    $display_name = mb_strlen($raw) > 200 ? mb_substr($raw, 0, 200) : $raw;

    $mysqli = get_db_connection();
    $stmt = $mysqli->prepare('UPDATE Users SET display_name = ?, updated_at = NOW() WHERE id = ?');
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $display_value = $display_name === '' ? null : $display_name;
    $stmt->bind_param('si', $display_value, $user_id);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed']);
        return;
    }
    $stmt->close();

    $_SESSION['display_name'] = ($display_name !== '' && $display_name !== null) ? $display_name : ($_SESSION['email'] ?? '');

    echo json_encode([
        'success' => true,
        'user' => auth_get_user(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
