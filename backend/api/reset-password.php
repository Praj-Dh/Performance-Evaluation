<?php
/**
 * POST /api/reset-password.php
 * Body: { "token": "...", "password": "newpassword" }
 * Validates one-time token (by hash), updates password, invalidates token.
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../utils/cors_headers.php';
require_once __DIR__ . '/../utils/api_errors.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $token = isset($data['token']) ? trim($data['token']) : '';
    $password = isset($data['password']) ? $data['password'] : '';

    if ($token === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Token and password are required']);
        return;
    }

    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters']);
        return;
    }

    $token_hash = hash('sha256', $token);
    $now = date('Y-m-d H:i:s');

    $mysqli = get_db_connection();

    $stmt = $mysqli->prepare(
        'SELECT id, user_id FROM PasswordResetTokens WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL LIMIT 1'
    );
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $stmt->bind_param('ss', $token_hash, $now);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    if (!$row) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired reset link. Request a new one.']);
        return;
    }

    $user_id = (int) $row['user_id'];
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
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

    $stmt = $mysqli->prepare('UPDATE PasswordResetTokens SET used_at = NOW() WHERE id = ?');
    if ($stmt) {
        $tid = (int) $row['id'];
        $stmt->bind_param('i', $tid);
        $stmt->execute();
        $stmt->close();
    }

    echo json_encode(['success' => true, 'message' => 'Password updated. You can sign in now.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
