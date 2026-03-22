<?php
/**
 * Auth helpers: session + role. Use require_session() in APIs that need a logged-in user.
 */

require_once __DIR__ . '/../config/session_config.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function auth_get_user() {
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    return [
        'id' => (int) $_SESSION['user_id'],
        'email' => $_SESSION['email'] ?? '',
        'display_name' => $_SESSION['display_name'] ?? $_SESSION['email'] ?? '',
        'role' => $_SESSION['role'] ?? 'employee',
    ];
}

function require_session() {
    if (empty($_SESSION['user_id'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }
}

function require_role($allowed_roles) {
    $allowed = is_array($allowed_roles) ? $allowed_roles : [$allowed_roles];
    $role = $_SESSION['role'] ?? 'employee';
    if (!in_array($role, $allowed, true)) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}
