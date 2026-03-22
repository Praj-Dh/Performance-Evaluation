<?php
/**
 * POST /api/resend-verification.php
 * Body: { "email": "..." }
 * Sends a new email verification OTP for an unverified account.
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../utils/cors_headers.php';
require_once __DIR__ . '/../utils/mailer.php';
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

    if ($email === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        return;
    }
    if (strlen($email) > 255 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid email address']);
        return;
    }

    $mysqli = get_db_connection();
    $stmt = $mysqli->prepare('SELECT id, display_name FROM Users WHERE email = ? AND email_verified_at IS NULL LIMIT 1');
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
        echo json_encode([
            'success' => true,
            'message' => 'If an account with this email exists and is unverified, we\'ve sent a new verification code.',
        ]);
        return;
    }

    $user_id = (int) $user['id'];
    $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otp_hash = hash('sha256', $otp);
    $expires_at = date('Y-m-d H:i:s', time() + 900);

    $stmt = $mysqli->prepare('INSERT INTO EmailVerificationOtps (user_id, otp_hash, expires_at) VALUES (?, ?, ?)');
    if (!$stmt || !$stmt->bind_param('iss', $user_id, $otp_hash, $expires_at) || !$stmt->execute()) {
        $stmt && $stmt->close();
        http_response_code(500);
        echo json_encode(['error' => 'Could not create verification code']);
        return;
    }
    $stmt->close();

    send_app_email_template($email, 'email_verification', [
        'otp' => $otp,
        'display_name' => $user['display_name'] ?? $email,
    ]);

    $out = [
        'success' => true,
        'message' => 'A new verification code has been sent to your email.',
    ];
    if (mailer_should_return_otp_in_response()) {
        $out['dev_otp'] = $otp;
    }
    echo json_encode($out);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
