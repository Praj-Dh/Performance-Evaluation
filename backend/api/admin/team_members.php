<?php
/**
 * Admin: CRUD for team members.
 * GET: list all (id, user_id, team_id, team_name, manager_name, name, role, department, email).
 * POST: create (body: { user_id?, team_id, name, role?, department?, email? }).
 * PUT: update (body: { id, team_id?, name?, role?, department?, email? }).
 * DELETE: delete (query: id=).
 */

require_once __DIR__ . '/../require_admin.php';

$mysqli = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT tm.id, tm.user_id, tm.team_id, tm.name, tm.role, tm.department, tm.email, tm.created_at,
            t.name AS team_name, u_mgr.display_name AS manager_name
            FROM TeamMembers tm
            LEFT JOIN Teams t ON t.id = tm.team_id
            LEFT JOIN Users u_mgr ON u_mgr.id = t.manager_id
            ORDER BY t.name ASC, tm.name ASC";
    $result = $mysqli->query($sql);
    if (!$result) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $members = [];
    while ($row = $result->fetch_assoc()) {
        $members[] = [
            'id' => (int) $row['id'],
            'user_id' => $row['user_id'] ? (int) $row['user_id'] : null,
            'team_id' => (int) $row['team_id'],
            'team_name' => $row['team_name'],
            'manager_name' => $row['manager_name'],
            'name' => $row['name'],
            'role' => $row['role'],
            'department' => $row['department'],
            'email' => $row['email'],
            'created_at' => $row['created_at'],
        ];
    }
    echo json_encode(['team_members' => $members]);
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = isset($data['user_id']) ? (int) $data['user_id'] : null;
    $teamId = isset($data['team_id']) ? (int) $data['team_id'] : 0;
    $name = isset($data['name']) ? trim($data['name']) : '';
    $role = isset($data['role']) ? trim($data['role']) : null;
    $department = isset($data['department']) ? trim($data['department']) : null;
    $email = isset($data['email']) ? trim($data['email']) : null;
    if ($teamId < 1 || $name === '') {
        http_response_code(400);
        echo json_encode(['error' => 'team_id and name are required']);
        return;
    }
    $stmt = $mysqli->prepare('INSERT INTO TeamMembers (user_id, team_id, name, role, department, email) VALUES (?, ?, ?, ?, ?, ?)');
    if (!$stmt || !$stmt->bind_param('iissss', $userId, $teamId, $name, $role, $department, $email) || !$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Create failed']);
        return;
    }
    $id = (int) $stmt->insert_id;
    $stmt->close();
    echo json_encode(['success' => true, 'id' => $id]);
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = isset($data['id']) ? (int) $data['id'] : 0;
    if ($id < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'Member id is required']);
        return;
    }
    $updates = [];
    $types = '';
    $bindParams = [];
    if (array_key_exists('team_id', $data)) {
        $updates[] = 'team_id = ?';
        $types .= 'i';
        $bindParams[] = (int) $data['team_id'];
    }
    if (array_key_exists('name', $data)) {
        $updates[] = 'name = ?';
        $types .= 's';
        $bindParams[] = trim($data['name']);
    }
    if (array_key_exists('role', $data)) {
        $updates[] = 'role = ?';
        $types .= 's';
        $bindParams[] = trim($data['role']) ?: null;
    }
    if (array_key_exists('department', $data)) {
        $updates[] = 'department = ?';
        $types .= 's';
        $bindParams[] = trim($data['department']) ?: null;
    }
    if (array_key_exists('email', $data)) {
        $updates[] = 'email = ?';
        $types .= 's';
        $bindParams[] = trim($data['email']) ?: null;
    }
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nothing to update']);
        return;
    }
    $bindParams[] = $id;
    $types .= 'i';
    $sql = 'UPDATE TeamMembers SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $stmt = $mysqli->prepare($sql);
    if (!$stmt || !$stmt->bind_param($types, ...$bindParams) || !$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Update failed']);
        return;
    }
    $stmt->close();
    echo json_encode(['success' => true]);
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    if ($id < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'Member id is required']);
        return;
    }
    $stmt = $mysqli->prepare('DELETE FROM TeamMembers WHERE id = ?');
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) {
        $stmt->close();
        http_response_code(500);
        echo json_encode(['error' => 'Delete failed']);
        return;
    }
    $stmt->close();
    echo json_encode(['success' => true]);
    return;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
