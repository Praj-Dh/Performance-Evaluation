<?php
/**
 * POST /api/forgot-password.php
 * Request a password reset. Creates a one-time token (stored as hash), expires in 1 hour.
 * Sends reset link by email via app mailer (reactive: environment).
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
    $method = isset($data['method']) && $data['method'] === 'otp' ? 'otp' : 'link';

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

    $stmt = $mysqli->prepare('SELECT id FROM Users WHERE email = ? AND email_verified_at IS NOT NULL LIMIT 1');
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    if ($row) {
        $user_id = (int) $row['id'];
        $expires_at = date('Y-m-d H:i:s', time() + ($method === 'otp' ? 900 : 3600)); // 15 min OTP, 1 hr link

        if ($method === 'otp') {
            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $otp_hash = hash('sha256', $otp);
            $stmt = $mysqli->prepare('INSERT INTO PasswordResetOtps (user_id, otp_hash, expires_at) VALUES (?, ?, ?)');
            if ($stmt) {
                $stmt->bind_param('iss', $user_id, $otp_hash, $expires_at);
                $stmt->execute();
                $stmt->close();
            }
            send_app_email_template($email, 'password_reset_otp', ['otp' => $otp]);
            $out = ['success' => true, 'message' => 'If an account exists for that email, we\'ve sent a verification code. Use it on the reset password page.', 'method' => 'otp'];
        } else {
            $token = bin2hex(random_bytes(32));
            $token_hash = hash('sha256', $token);
            $stmt = $mysqli->prepare('INSERT INTO PasswordResetTokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)');
            if ($stmt) {
                $stmt->bind_param('iss', $user_id, $token_hash, $expires_at);
                $stmt->execute();
                $stmt->close();
            }
            $reset_url = get_app_base_url() . '/reset-password?token=' . urlencode($token);
            send_app_email_template($email, 'password_reset', ['reset_url' => $reset_url]);
            $out = ['success' => true, 'message' => 'If an account exists for that email, we\'ve sent a reset link.'];
            if (getenv('APP_ENV') === 'development') {
                $out['reset_token'] = $token;
            }
        }
        echo json_encode($out);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'If an account exists for that email, we\'ve sent reset instructions.',
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
