<?php
/**
 * GET /api/peers.php
 * Returns team members in the current user's team (peers), excluding the current user.
 * Used by the employee Peers page to show teammates and enable chat/calendar.
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
    $current_user_id = (int) $user['id'];

    $mysqli = get_db_connection();

    // Get current user's team_id (first team they belong to)
    $stmt = $mysqli->prepare(
        'SELECT tm.team_id, t.name AS team_name
         FROM TeamMembers tm
         INNER JOIN Teams t ON t.id = tm.team_id
         WHERE tm.user_id = ? LIMIT 1'
    );
    if (!$stmt || !$stmt->bind_param('i', $current_user_id) || !$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $stmt->close();

    if (!$row) {
        echo json_encode(['team_name' => null, 'peers' => []]);
        return;
    }

    $team_id = (int) $row['team_id'];
    $team_name = $row['team_name'];

    // Get other members in the same team who have user accounts (user_id IS NOT NULL), excluding self
    $stmt = $mysqli->prepare(
        'SELECT tm.id, tm.user_id, tm.name, tm.role, tm.department, tm.email,
                u.display_name
         FROM TeamMembers tm
         LEFT JOIN Users u ON u.id = tm.user_id
         WHERE tm.team_id = ? AND tm.user_id IS NOT NULL AND tm.user_id != ?
         ORDER BY tm.name ASC'
    );
    if (!$stmt || !$stmt->bind_param('ii', $team_id, $current_user_id) || !$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $result = $stmt->get_result();
    $peers = [];
    while ($r = $result->fetch_assoc()) {
        $peers[] = [
            'id' => (int) $r['id'],
            'user_id' => (int) $r['user_id'],
            'display_name' => $r['display_name'] ?? $r['name'],
            'name' => $r['name'],
            'role' => $r['role'],
            'department' => $r['department'],
            'email' => $r['email'],
        ];
    }
    $stmt->close();

    echo json_encode([
        'team_name' => $team_name,
        'peers' => $peers,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
