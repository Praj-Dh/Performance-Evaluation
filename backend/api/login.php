<?php
/**
 * POST /api/login.php
 * Authenticates user by email + password. Uses session for auth state.
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../utils/cors_headers.php';
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
    $password = isset($data['password']) ? $data['password'] : '';

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

    $mysqli = get_db_connection();
    $stmt = $mysqli->prepare('SELECT id, email, password_hash, display_name, COALESCE(role, \'employee\') AS role, email_verified_at FROM Users WHERE email = ? LIMIT 1');
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        return;
    }

    if (empty($user['email_verified_at'])) {
        http_response_code(403);
        echo json_encode([
            'error' => 'Please verify your email before signing in. Check your inbox for the verification code.',
            'code' => 'email_not_verified',
            'email' => $user['email'],
        ]);
        return;
    }

    $role = isset($user['role']) && in_array($user['role'], ['employee', 'manager', 'admin'], true) ? $user['role'] : 'employee';
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['display_name'] = $user['display_name'] ?? $user['email'];
    $_SESSION['role'] = $role;

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => (int) $user['id'],
            'email' => $user['email'],
            'display_name' => $user['display_name'] ?? $user['email'],
            'role' => $role,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
