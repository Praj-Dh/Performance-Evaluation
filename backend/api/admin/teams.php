<?php
/**
 * Admin: CRUD for teams.
 * GET: list all teams (id, name, department, manager_id, manager_name).
 * POST: create team (body: { name, department?, manager_id? }).
 * PUT: update team (body: { id, name?, department?, manager_id? }).
 * DELETE: delete team (query: id=). Fails if team has members.
 */

require_once __DIR__ . '/../require_admin.php';

$mysqli = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT t.id, t.name, t.department, t.manager_id, u.display_name AS manager_name
            FROM Teams t LEFT JOIN Users u ON u.id = t.manager_id ORDER BY t.name ASC";
    $result = $mysqli->query($sql);
    if (!$result) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $teams = [];
    while ($row = $result->fetch_assoc()) {
        $teams[] = [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'department' => $row['department'],
            'manager_id' => $row['manager_id'] ? (int) $row['manager_id'] : null,
            'manager_name' => $row['manager_name'],
        ];
    }
    echo json_encode(['teams' => $teams]);
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = isset($data['name']) ? trim($data['name']) : '';
    $department = isset($data['department']) ? trim($data['department']) : null;
    $managerId = isset($data['manager_id']) && $data['manager_id'] !== '' && $data['manager_id'] !== null
        ? (int) $data['manager_id'] : null;
    if ($name === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Team name is required']);
        return;
    }
    $stmt = $mysqli->prepare('INSERT INTO Teams (name, department, manager_id) VALUES (?, ?, ?)');
    if (!$stmt || !$stmt->bind_param('ssi', $name, $department, $managerId) || !$stmt->execute()) {
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
        echo json_encode(['error' => 'Team id is required']);
        return;
    }
    $updates = [];
    $types = '';
    $bindParams = [];
    if (array_key_exists('name', $data)) {
        $updates[] = 'name = ?';
        $types .= 's';
        $bindParams[] = trim($data['name']);
    }
    if (array_key_exists('department', $data)) {
        $updates[] = 'department = ?';
        $types .= 's';
        $bindParams[] = trim($data['department']) ?: null;
    }
    if (array_key_exists('manager_id', $data)) {
        $updates[] = 'manager_id = ?';
        $types .= 'i';
        $bindParams[] = $data['manager_id'] ? (int) $data['manager_id'] : null;
    }
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nothing to update']);
        return;
    }
    $bindParams[] = $id;
    $types .= 'i';
    $sql = 'UPDATE Teams SET ' . implode(', ', $updates) . ' WHERE id = ?';
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
        echo json_encode(['error' => 'Team id is required']);
        return;
    }
    $stmt = $mysqli->prepare('SELECT 1 FROM TeamMembers WHERE team_id = ? LIMIT 1');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()) {
        $stmt->close();
        http_response_code(400);
        echo json_encode(['error' => 'Cannot delete team that has members. Reassign or remove members first.']);
        return;
    }
    $stmt->close();
    $stmt = $mysqli->prepare('DELETE FROM Teams WHERE id = ?');
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
