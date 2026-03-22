<?php
/**
 * GET /api/feedback_requests.php - List feedback requests for the current user.
 * POST /api/feedback_requests.php - Create a feedback request (to current user's manager).
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../utils/cors_headers.php';
require_once __DIR__ . '/../utils/auth_helpers.php';
require_once __DIR__ . '/../utils/api_errors.php';
require_once __DIR__ . '/../utils/mailer.php';

header('Content-Type: application/json');

try {
    require_session();
    $user = auth_get_user();
    $user_id = (int) $user['id'];
    $mysqli = get_db_connection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $mysqli->prepare(
            'SELECT id, requested_by, requested_from, message, status, created_at, updated_at
             FROM FeedbackRequests
             WHERE requested_by = ?
             ORDER BY created_at DESC'
        );
        if (!$stmt || !$stmt->bind_param('i', $user_id) || !$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error']);
            return;
        }
        $result = $stmt->get_result();
        $requests = [];
        while ($row = $result->fetch_assoc()) {
            $requests[] = [
                'id' => (int) $row['id'],
                'requested_by' => (int) $row['requested_by'],
                'requested_from' => (int) $row['requested_from'],
                'message' => $row['message'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            ];
        }
        $stmt->close();
        echo json_encode(['feedback_requests' => $requests]);
        return;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?: [];
        $message = isset($data['message']) && is_string($data['message'])
            ? trim($data['message'])
            : null;
        if ($message === '') {
            $message = null;
        }

        // Resolve manager: TeamMembers -> Teams.manager_id for current user
        $manager_id = null;
        $stmt = $mysqli->prepare(
            'SELECT t.manager_id FROM TeamMembers tm
             INNER JOIN Teams t ON t.id = tm.team_id
             WHERE tm.user_id = ? AND t.manager_id IS NOT NULL LIMIT 1'
        );
        if ($stmt && $stmt->bind_param('i', $user_id) && $stmt->execute()) {
            $stmt->bind_result($manager_id);
            $stmt->fetch();
            $stmt->close();
        }
        if (!$manager_id) {
            http_response_code(400);
            echo json_encode(['error' => 'No manager assigned. You must be in a team with a manager to request feedback.']);
            return;
        }
        $manager_id = (int) $manager_id;

        $stmt = $mysqli->prepare(
            'INSERT INTO FeedbackRequests (requested_by, requested_from, message, status) VALUES (?, ?, ?, ?)'
        );
        $status = 'pending';
        if (!$stmt || !$stmt->bind_param('iiss', $user_id, $manager_id, $message, $status) || !$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error']);
            return;
        }
        $id = (int) $mysqli->insert_id;
        $stmt->close();

        // Return created row
        $stmt = $mysqli->prepare(
            'SELECT id, requested_by, requested_from, message, status, created_at, updated_at
             FROM FeedbackRequests WHERE id = ?'
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        // Send email notification to manager (same content as in-app notification)
        $manager_email = null;
        $manager_display_name = null;
        $requester_name = null;
        $team_id_for_url = null;
        $stmt = $mysqli->prepare('SELECT email, display_name FROM Users WHERE id = ? LIMIT 1');
        if ($stmt && $stmt->bind_param('i', $manager_id) && $stmt->execute()) {
            $stmt->bind_result($manager_email, $manager_display_name);
            $stmt->fetch();
            $stmt->close();
        }
        $stmt = $mysqli->prepare('SELECT display_name FROM Users WHERE id = ? LIMIT 1');
        if ($stmt && $stmt->bind_param('i', $user_id) && $stmt->execute()) {
            $stmt->bind_result($requester_name);
            $stmt->fetch();
            $stmt->close();
        }
        $stmt = $mysqli->prepare(
            'SELECT tm.team_id FROM TeamMembers tm INNER JOIN Teams t ON t.id = tm.team_id WHERE tm.user_id = ? AND t.manager_id = ? LIMIT 1'
        );
        if ($stmt && $stmt->bind_param('ii', $user_id, $manager_id) && $stmt->execute()) {
            $stmt->bind_result($team_id_for_url);
            $stmt->fetch();
            $stmt->close();
        }
        if ($manager_email !== null && filter_var($manager_email, FILTER_VALIDATE_EMAIL)) {
            $base = get_app_base_url();
            $write_review_url = $base . '/write-review?feedback_request_id=' . (int) $id . '&employee_id=' . (int) $user_id;
            if ($team_id_for_url !== null) {
                $write_review_url .= '&team_id=' . (int) $team_id_for_url;
            }
            send_app_email_template($manager_email, 'feedback_request', [
                'manager_display_name' => $manager_display_name ?: 'Manager',
                'requester_name' => $requester_name ?: 'An employee',
                'message' => $message,
                'write_review_url' => $write_review_url,
            ]);
        }

        echo json_encode([
            'feedback_request' => [
                'id' => (int) $row['id'],
                'requested_by' => (int) $row['requested_by'],
                'requested_from' => (int) $row['requested_from'],
                'message' => $row['message'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            ],
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
