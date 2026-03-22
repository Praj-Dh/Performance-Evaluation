<?php
/**
 * GET /api/manager/team-members.php?team_id=...
 * Returns team members for the given team. Current user must be the manager of that team.
 * Returns user_id, display_name, email for members who have a Users account (tm.user_id = u.id).
 */

require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../../utils/cors_headers.php';
require_once __DIR__ . '/../../utils/auth_helpers.php';
require_once __DIR__ . '/../../utils/api_errors.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    require_session();
    $user = auth_get_user();
    $role = $user['role'] ?? 'employee';
    if ($role !== 'manager' && $role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        return;
    }

    $team_id = isset($_GET['team_id']) ? (int) $_GET['team_id'] : 0;
    if ($team_id < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'team_id required']);
        return;
    }

    $manager_id = (int) $user['id'];
    $mysqli = get_db_connection();

    // Verify current user is manager of this team
    $stmt = $mysqli->prepare('SELECT id FROM Teams WHERE id = ? AND manager_id = ?');
    if (!$stmt || !$stmt->bind_param('ii', $team_id, $manager_id) || !$stmt->execute() || !$stmt->get_result()->fetch_assoc()) {
        $stmt && $stmt->close();
        http_response_code(403);
        echo json_encode(['error' => 'You can only view members of teams you manage']);
        return;
    }
    $stmt->close();

    // Only members with user_id (login account) can receive reviews
    $sql = "SELECT tm.user_id, COALESCE(u.display_name, tm.name) AS display_name, COALESCE(u.email, tm.email) AS email, tm.name AS member_name, tm.role
            FROM TeamMembers tm
            LEFT JOIN Users u ON u.id = tm.user_id
            WHERE tm.team_id = ? AND tm.user_id IS NOT NULL
            ORDER BY COALESCE(u.display_name, tm.name) ASC";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt || !$stmt->bind_param('i', $team_id) || !$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $result = $stmt->get_result();
    $members = [];
    while ($row = $result->fetch_assoc()) {
        $members[] = [
            'user_id' => $row['user_id'] ? (int) $row['user_id'] : null,
            'display_name' => $row['display_name'] ?: $row['member_name'] ?: 'Unknown',
            'email' => $row['email'],
            'role' => $row['role'],
        ];
    }
    $stmt->close();

    echo json_encode(['team_members' => $members]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
