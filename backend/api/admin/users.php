<?php
/**
 * Admin: list and update users.
 * GET: list all users (id, email, display_name, role, email_verified_at, team_name).
 * PATCH: update role, display_name, or set email_verified_at (body: { id, role?, display_name?, email_verified?: true }).
 */

require_once __DIR__ . '/../require_admin.php';

$mysqli = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT u.id, u.email, u.display_name, u.role, u.email_verified_at, u.created_at,
            (SELECT t.name FROM TeamMembers tm LEFT JOIN Teams t ON t.id = tm.team_id WHERE tm.user_id = u.id LIMIT 1) AS team_name
            FROM Users u ORDER BY u.id ASC";
    $result = $mysqli->query($sql);
    if (!$result) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            'id' => (int) $row['id'],
            'email' => $row['email'],
            'display_name' => $row['display_name'],
            'role' => $row['role'],
            'email_verified_at' => $row['email_verified_at'],
            'created_at' => $row['created_at'],
            'team_name' => $row['team_name'],
        ];
    }
    echo json_encode(['users' => $users]);
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = isset($data['id']) ? (int) $data['id'] : 0;
    if ($id < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'User id is required']);
        return;
    }
    $updates = [];
    $types = '';
    $bindParams = [];
    if (array_key_exists('role', $data) && in_array($data['role'], ['employee', 'manager', 'admin'], true)) {
        $updates[] = 'role = ?';
        $types .= 's';
        $bindParams[] = $data['role'];
    }
    if (array_key_exists('display_name', $data)) {
        $updates[] = 'display_name = ?';
        $types .= 's';
        $bindParams[] = trim($data['display_name']);
    }
    if (!empty($data['email_verified']) && $data['email_verified']) {
        $updates[] = 'email_verified_at = COALESCE(email_verified_at, NOW())';
    }
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nothing to update']);
        return;
    }
    $bindParams[] = $id;
    $types .= 'i';
    $sql = 'UPDATE Users SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed']);
        return;
    }
    $stmt->bind_param($types, ...$bindParams);
    if (!$stmt->execute()) {
        $stmt->close();
        http_response_code(500);
        echo json_encode(['error' => 'Update failed']);
        return;
    }
    $stmt->close();
    echo json_encode(['success' => true]);
    return;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
