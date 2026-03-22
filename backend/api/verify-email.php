<?php
/**
 * POST /api/verify-email.php
 * Body: { "email": "...", "otp": "123456" }
 * Verifies the OTP and sets email_verified_at so the user can sign in.
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../utils/cors_headers.php';
require_once __DIR__ . '/../utils/mailer.php';
require_once __DIR__ . '/../utils/api_errors.php';

header('Content-Type: application/json');

try {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $email = isset($data['email']) ? trim($data['email']) : '';
    $otp = isset($data['otp']) ? trim($data['otp']) : '';

    if ($email === '' || $otp === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Email and verification code are required']);
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

    $mysqli = get_db_connection();
    $stmt = $mysqli->prepare('SELECT id, display_name, COALESCE(role, \'employee\') AS role FROM Users WHERE email = ? AND email_verified_at IS NULL LIMIT 1');
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
        echo json_encode(['error' => 'No unverified account found for this email, or the account is already verified.']);
        return;
    }

    $user_id = (int) $user['id'];
    $otp_hash = hash('sha256', $otp);
    $now = date('Y-m-d H:i:s');

    $stmt = $mysqli->prepare(
        'SELECT id FROM EmailVerificationOtps WHERE user_id = ? AND otp_hash = ? AND expires_at > ? AND used_at IS NULL LIMIT 1'
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
        echo json_encode(['error' => 'Invalid or expired verification code. Request a new one from the verification page.']);
        return;
    }

    $stmt = $mysqli->prepare('UPDATE Users SET email_verified_at = NOW() WHERE id = ?');
    if (!$stmt || !$stmt->bind_param('i', $user_id) || !$stmt->execute()) {
        $stmt && $stmt->close();
        http_response_code(500);
        echo json_encode(['error' => 'Could not verify account']);
        return;
    }
    $stmt->close();

    $stmt = $mysqli->prepare('UPDATE EmailVerificationOtps SET used_at = NOW() WHERE id = ?');
    if ($stmt) {
        $tid = (int) $row['id'];
        $stmt->bind_param('i', $tid);
        $stmt->execute();
        $stmt->close();
    }

    $role = isset($user['role']) && in_array($user['role'], ['employee', 'manager', 'admin'], true) ? $user['role'] : 'employee';
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user_id;
    $_SESSION['email'] = $email;
    $_SESSION['display_name'] = $user['display_name'] ?? $email;
    $_SESSION['role'] = $role;

    send_app_email_template($email, 'welcome', [
        'display_name' => $user['display_name'] ?? $email,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Email verified. You can now use your account.',
        'user' => [
            'id' => $user_id,
            'email' => $email,
            'display_name' => $user['display_name'] ?? $email,
            'role' => $role,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
