<?php
/**
 * GET /api/team_members.php
 * Returns a JSON array of team members from the TeamMembers table.
 * Requires an active session (logged-in user).
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

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        return;
    }

    $mysqli = get_db_connection();

    // JOIN to Users on email so we get the real Users.id (user_id)
    // This is the key fix — TeamMembers.id and Users.id are different records
    $sql = "SELECT 
                tm.id,
                tm.name,
                tm.role,
                tm.department,
                tm.email,
                tm.created_at,
                tm.team_id,
                t.name AS team_name,
                u.id AS user_id,
                u.display_name
            FROM TeamMembers tm
            LEFT JOIN Teams t ON t.id = tm.team_id
            LEFT JOIN Users u ON u.email = tm.email
            ORDER BY tm.created_at DESC, tm.id DESC";

    $result = $mysqli->query($sql);

    if (!$result) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error fetching team members']);
        return;
    }

    $members = [];
    while ($row = $result->fetch_assoc()) {
        $members[] = [
            'id'           => (int) $row['id'],
            'user_id'      => $row['user_id'] ? (int) $row['user_id'] : null,
            'display_name' => $row['display_name'] ?? $row['name'],
            'name'         => $row['name'],
            'role'         => $row['role'],
            'department'   => $row['department'],
            'email'        => $row['email'],
            'created_at'   => $row['created_at'],
            'team_id'      => $row['team_id'] ? (int) $row['team_id'] : null,
            'team_name'    => $row['team_name'],
        ];
    }

    echo json_encode(['team_members' => $members]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}