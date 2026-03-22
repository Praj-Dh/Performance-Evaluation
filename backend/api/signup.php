<?php
/**
 * POST /api/signup.php
 * Registers a new user. Sends OTP for email verification; user cannot sign in until verified.
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
    $password = isset($data['password']) ? $data['password'] : '';
    $display_name = isset($data['display_name']) ? trim($data['display_name']) : '';
    $role = isset($data['role']) && $data['role'] === 'manager' ? 'manager' : 'employee';
    
    $team_id = isset($data['team_id']) ? (int)$data['team_id'] : null;

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }
    if (strlen($email) > 255 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid email address']);
        return;
    }

    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters']);
        return;
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    if ($password_hash === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not hash password']);
        return;
    }

    $mysqli = get_db_connection();
    $stmt = $mysqli->prepare('INSERT INTO Users (email, password_hash, display_name, role) VALUES (?, ?, ?, ?)');
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $display_name_value = $display_name !== '' ? $display_name : null;
    $stmt->bind_param('ssss', $email, $password_hash, $display_name_value, $role);
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) {
        if ($mysqli->errno === 1062) {
            http_response_code(409);
            echo json_encode(['error' => 'An account with this email already exists']);
            return;
        }
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed']);
        return;
    }

    $user_id = (int) $mysqli->insert_id;

    if ($role === 'manager' && $team_id) {
        // Create a fallback name from the email if display_name is empty
        $member_name = $display_name !== '' ? $display_name : explode('@', $email)[0];
        
        $stmtTeam = $mysqli->prepare('INSERT INTO TeamMembers (user_id, team_id, name, role, email) VALUES (?, ?, ?, ?, ?)');
        if ($stmtTeam) {
            // Bind parameters: i=integer, s=string
            $stmtTeam->bind_param('iisss', $user_id, $team_id, $member_name, $role, $email);
            $stmtTeam->execute();
            $stmtTeam->close();
        }
    }

    $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otp_hash = hash('sha256', $otp);
    $expires_at = date('Y-m-d H:i:s', time() + 900); // 15 minutes

    $stmt = $mysqli->prepare('INSERT INTO EmailVerificationOtps (user_id, otp_hash, expires_at) VALUES (?, ?, ?)');
    if (!$stmt || !$stmt->bind_param('iss', $user_id, $otp_hash, $expires_at) || !$stmt->execute()) {
        $stmt && $stmt->close();
        http_response_code(500);
        echo json_encode(['error' => 'Could not create verification code']);
        return;
    }
    $stmt->close();

    mailer_log_line(date('Y-m-d H:i:s') . ' | signup: sending verification to ' . $email);

    $mail_sent = send_app_email_template($email, 'email_verification', [
        'otp' => $otp,
        'display_name' => $display_name !== '' ? $display_name : $email,
    ]);

    $out = [
        'success' => true,
        'message' => 'Account created. Please check your email for the verification code to activate your account.',
        'email' => $email,
        'require_verification' => true,
        'mail_sent' => $mail_sent,
    ];
    if (mailer_should_return_otp_in_response()) {
        $out['dev_otp'] = $otp;
    }
    echo json_encode($out);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
