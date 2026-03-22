<?php
/**
 * POST /api/reset-password-with-otp.php
 * Body: { "email": "...", "otp": "123456", "password": "newpassword" }
 * Verifies OTP from PasswordResetOtps and updates user password.
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
    $email = isset($data['email']) ? trim($data['email']) : '';
    $otp = isset($data['otp']) ? trim($data['otp']) : '';
    $password = isset($data['password']) ? $data['password'] : '';

    if ($email === '' || $otp === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Email, verification code, and new password are required']);
        return;
    }
    if (strlen($email) > 255 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid email address']);
        return;
    }

    if (!preg_match('/^\d{6}$/', $otp)) {
        http_response_code(400);
        echo json_encode(['error' => 'Verification code must be 6 digits']);
        return;
    }

    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters']);
        return;
    }

    $mysqli = get_db_connection();
    $stmt = $mysqli->prepare('SELECT id FROM Users WHERE email = ? LIMIT 1');
    if (!$stmt || !$stmt->bind_param('s', $email) || !$stmt->execute()) {
        $stmt && $stmt->close();
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired verification code. Request a new one.']);
        return;
    }

    $user_id = (int) $user['id'];
    $otp_hash = hash('sha256', $otp);
    $now = date('Y-m-d H:i:s');

    $stmt = $mysqli->prepare(
        'SELECT id FROM PasswordResetOtps WHERE user_id = ? AND otp_hash = ? AND expires_at > ? AND used_at IS NULL LIMIT 1'
    );
    if (!$stmt || !$stmt->bind_param('iss', $user_id, $otp_hash, $now) || !$stmt->execute()) {
        $stmt && $stmt->close();
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired verification code. Request a new one from the forgot password page.']);
        return;
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    if ($password_hash === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not hash password']);
        return;
    }

    $stmt = $mysqli->prepare('UPDATE Users SET password_hash = ?, updated_at = NOW() WHERE id = ?');
    if (!$stmt || !$stmt->bind_param('si', $password_hash, $user_id) || !$stmt->execute()) {
        $stmt && $stmt->close();
        http_response_code(500);
        echo json_encode(['error' => 'Could not update password']);
        return;
    }
    $stmt->close();

    $stmt = $mysqli->prepare('UPDATE PasswordResetOtps SET used_at = NOW() WHERE id = ?');
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
