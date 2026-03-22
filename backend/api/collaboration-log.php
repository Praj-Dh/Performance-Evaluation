<?php
/**
 * POST: create a collaboration event (log event).
 * GET: list collaboration events for current user.
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

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        return;
    }

    $user_id = (int) $_SESSION['user_id'];
    $mysqli = get_db_connection();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $event_type = isset($data['event_type']) ? trim($data['event_type']) : '';
        $title = isset($data['title']) ? trim($data['title']) : '';
        $event_date = isset($data['event_date']) ? trim($data['event_date']) : '';
        $description = isset($data['description']) ? trim($data['description']) : '';
        $tagged_peers = isset($data['tagged_peers']) ? trim($data['tagged_peers']) : '';
        $status = isset($data['status']) && $data['status'] === 'draft' ? 'draft' : 'submitted';

        $allowed_types = ['mentorship', 'peer_support', 'knowledge', 'cross_dept'];
        if (!in_array($event_type, $allowed_types, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid event type']);
            return;
        }
        if ($title === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required']);
            return;
        }
        if ($event_date === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Date is required']);
            return;
        }

        $stmt = $mysqli->prepare('INSERT INTO CollaborationEvents (user_id, event_type, title, event_date, description, tagged_peers, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error']);
            return;
        }
        $stmt->bind_param('issssss', $user_id, $event_type, $title, $event_date, $description, $tagged_peers, $status);
        $stmt->execute();
        $id = (int) $mysqli->insert_id;
        $stmt->close();
        echo json_encode(['success' => true, 'id' => $id]);
        return;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $mysqli->prepare('SELECT id, event_type, title, event_date, description, tagged_peers, status, created_at FROM CollaborationEvents WHERE user_id = ? ORDER BY event_date DESC, created_at DESC LIMIT 100');
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error']);
            return;
        }
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $events = [];
        while ($row = $result->fetch_assoc()) {
            $events[] = [
                'id' => (int) $row['id'],
                'event_type' => $row['event_type'],
                'title' => $row['title'],
                'event_date' => $row['event_date'],
                'description' => $row['description'],
                'tagged_peers' => $row['tagged_peers'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
            ];
        }
        $stmt->close();
        echo json_encode(['events' => $events]);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
