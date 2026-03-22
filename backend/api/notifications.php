<?php
/**
 * GET /api/notifications.php
 * For managers: returns pending feedback requests (employee requested feedback from me).
 * Others: returns empty list (or future notification types).
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
    $userId = (int) $user['id'];
    $role = $user['role'] ?? 'employee';

    $notifications = [];

    if ($role === 'manager' || $role === 'admin') {
        $mysqli = get_db_connection();
        // Include team_id (employee's team that this manager manages) for write-review pre-select
        $stmt = $mysqli->prepare(
            'SELECT fr.id AS feedback_request_id, fr.requested_by, fr.message, fr.created_at, u.display_name AS requested_by_name,
                    (SELECT tm.team_id FROM TeamMembers tm INNER JOIN Teams t ON t.id = tm.team_id WHERE tm.user_id = fr.requested_by AND t.manager_id = ? LIMIT 1) AS team_id
             FROM FeedbackRequests fr
             INNER JOIN Users u ON u.id = fr.requested_by
             WHERE fr.requested_from = ? AND fr.status = ?
             ORDER BY fr.created_at DESC
             LIMIT 50'
        );
        $status = 'pending';
        if ($stmt && $stmt->bind_param('iis', $userId, $userId, $status) && $stmt->execute()) {
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $notifications[] = [
                    'type' => 'feedback_request',
                    'id' => 'fb-' . (int) $row['feedback_request_id'],
                    'feedback_request_id' => (int) $row['feedback_request_id'],
                    'requested_by' => (int) $row['requested_by'],
                    'requested_by_name' => $row['requested_by_name'] ?: 'Employee',
                    'team_id' => $row['team_id'] ? (int) $row['team_id'] : null,
                    'message' => $row['message'],
                    'created_at' => $row['created_at'],
                ];
            }
            $stmt->close();
        }
    } elseif ($role === 'employee') {
        $mysqli = get_db_connection();
        // Latest review for this employee (used as \"your review is ready\" notification)
        $stmt = $mysqli->prepare(
            'SELECT r.id, r.title, r.review_date, r.created_at, m.display_name AS manager_name
             FROM Reviews r
             LEFT JOIN Users m ON m.id = r.manager_id
             WHERE r.user_id = ?
             ORDER BY COALESCE(r.review_date, r.created_at) DESC
             LIMIT 1'
        );
        if ($stmt && $stmt->bind_param('i', $userId) && $stmt->execute()) {
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $notifications[] = [
                    'type' => 'review_ready',
                    'id' => 'rev-' . (int) $row['id'],
                    'review_id' => (int) $row['id'],
                    'title' => $row['title'],
                    'manager_name' => $row['manager_name'],
                    'created_at' => $row['review_date'] ?: $row['created_at'],
                ];
            }
            $stmt->close();
        }
    }

    $notifications_seen_at = null;
    $mysqli = get_db_connection();
    $stmt = $mysqli->prepare('SELECT notifications_seen_at FROM Users WHERE id = ?');
    if ($stmt && $stmt->bind_param('i', $userId) && $stmt->execute()) {
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        if ($row !== null && isset($row['notifications_seen_at']) && $row['notifications_seen_at'] !== null) {
            $notifications_seen_at = $row['notifications_seen_at'];
        }
        $stmt->close();
    }
    $cutoff = $notifications_seen_at ? strtotime($notifications_seen_at) : 0;
    $unread_count = 0;
    foreach ($notifications as $n) {
        $created = isset($n['created_at']) ? strtotime($n['created_at']) : 0;
        if ($created > $cutoff) {
            $unread_count++;
        }
    }

    echo json_encode(['notifications' => $notifications, 'unread_count' => $unread_count]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
