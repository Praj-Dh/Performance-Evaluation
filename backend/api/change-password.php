<?php
/**
 * POST /api/change-password.php
 * Body: { "current_password": "...", "new_password": "..." }
 * Requires authenticated session. Verifies current password, then updates to new.
 * Doing some tiddy stuff
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../utils/cors_headers.php';
require_once __DIR__ . '/../utils/auth_helpers.php';
require_once __DIR__ . '/../utils/mailer.php';
require_once __DIR__ . '/../utils/api_errors.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    require_session();
    $user_id = (int) $_SESSION['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);
    $current = isset($data['current_password']) ? $data['current_password'] : '';
    $new = isset($data['new_password']) ? $data['new_password'] : '';

    if ($current === '' || $new === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Current password and new password are required']);
        return;
    }

    if (strlen($new) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'New password must be at least 8 characters']);
        return;
    }

    $mysqli = get_db_connection();
    $stmt = $mysqli->prepare('SELECT password_hash FROM Users WHERE id = ? LIMIT 1');
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    if (!$row || !password_verify($current, $row['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        return;
    }

    $password_hash = password_hash($new, PASSWORD_DEFAULT);
    if ($password_hash === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not hash password']);
        return;
    }

    $stmt = $mysqli->prepare('UPDATE Users SET password_hash = ?, updated_at = NOW() WHERE id = ?');
    if (!$stmt || !$stmt->bind_param('si', $password_hash, $user_id) || !$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not update password']);
        return;
    }
    $stmt->close();

    if (!empty($_SESSION['email'])) {
        send_app_email_template($_SESSION['email'], 'password_changed', []);
    }

    echo json_encode(['success' => true, 'message' => 'Password updated.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
