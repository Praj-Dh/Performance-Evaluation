<?php
/**
 * GET /api/me.php
 * Returns current session user or 401.
 * Includes manager_id and manager_display_name when user is in a team (for Request Feedback).
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../utils/cors_headers.php';
require_once __DIR__ . '/../utils/auth_helpers.php';
require_once __DIR__ . '/../utils/api_errors.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    require_session();
    $user = auth_get_user();

    $manager_id = null;
    $manager_display_name = null;
    $mysqli = get_db_connection();
    $uid = $user['id'];
    $stmt = $mysqli->prepare(
        'SELECT t.manager_id, m.display_name FROM TeamMembers tm
         INNER JOIN Teams t ON t.id = tm.team_id
         LEFT JOIN Users m ON m.id = t.manager_id
         WHERE tm.user_id = ? AND t.manager_id IS NOT NULL LIMIT 1'
    );
    if ($stmt && $stmt->bind_param('i', $uid) && $stmt->execute()) {
        $stmt->bind_result($manager_id, $manager_display_name);
        if ($stmt->fetch()) {
            $manager_id = (int) $manager_id;
            $manager_display_name = $manager_display_name ?: null;
        } else {
            $manager_id = null;
            $manager_display_name = null;
        }
        $stmt->close();
    }

    echo json_encode([
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'display_name' => $user['display_name'],
            'role' => $user['role'],
            'manager_id' => $manager_id,
            'manager_display_name' => $manager_display_name,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
