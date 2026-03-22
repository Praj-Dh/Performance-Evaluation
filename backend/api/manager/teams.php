<?php
/**
 * GET /api/manager/teams.php
 * Returns teams that the current user manages (Teams.manager_id = session user).
 * Requires manager or admin role.
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

    $manager_id = (int) $user['id'];
    $mysqli = get_db_connection();

    $stmt = $mysqli->prepare('SELECT id, name, department FROM Teams WHERE manager_id = ? ORDER BY name ASC');
    if (!$stmt || !$stmt->bind_param('i', $manager_id) || !$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $result = $stmt->get_result();
    $teams = [];
    while ($row = $result->fetch_assoc()) {
        $teams[] = [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'department' => $row['department'],
        ];
    }
    $stmt->close();

    echo json_encode(['teams' => $teams]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
