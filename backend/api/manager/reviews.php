<?php
/**
 * POST /api/manager/reviews.php
 * Create a review for a team member. Manager can only write reviews for users in teams they manage.
 * Body: user_id, team_id, title, content?, score?, manager_feedback?, score_technical?, score_impact?, score_leadership?, rating?, review_type?, feedback_request_id?
 * If feedback_request_id is provided and valid, the feedback request is marked completed.
 */

require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../../utils/cors_headers.php';
require_once __DIR__ . '/../../utils/auth_helpers.php';
require_once __DIR__ . '/../../utils/api_errors.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $user_id = isset($data['user_id']) ? (int) $data['user_id'] : 0;
    $team_id = isset($data['team_id']) ? (int) $data['team_id'] : 0;
    $title = isset($data['title']) && is_string($data['title']) ? trim($data['title']) : '';
    if ($user_id < 1 || $team_id < 1 || $title === '') {
        http_response_code(400);
        echo json_encode(['error' => 'user_id, team_id, and title are required']);
        return;
    }

    $mysqli = get_db_connection();

    // Verify manager owns this team
    $stmt = $mysqli->prepare('SELECT id FROM Teams WHERE id = ? AND manager_id = ?');
    if (!$stmt || !$stmt->bind_param('ii', $team_id, $manager_id) || !$stmt->execute() || !$stmt->get_result()->fetch_assoc()) {
        if ($stmt) $stmt->close();
        http_response_code(403);
        echo json_encode(['error' => 'You can only write reviews for members of teams you manage']);
        return;
    }
    $stmt->close();

    // Verify user_id is a member of this team
    $stmt = $mysqli->prepare('SELECT 1 FROM TeamMembers WHERE team_id = ? AND user_id = ? LIMIT 1');
    if (!$stmt || !$stmt->bind_param('ii', $team_id, $user_id) || !$stmt->execute() || !$stmt->get_result()->fetch_assoc()) {
        if ($stmt) $stmt->close();
        http_response_code(403);
        echo json_encode(['error' => 'Selected member is not in this team']);
        return;
    }
    $stmt->close();

    $content = isset($data['content']) && is_string($data['content']) ? trim($data['content']) : null;
    $score = isset($data['score']) ? (int) $data['score'] : null;
    $manager_feedback = isset($data['manager_feedback']) && is_string($data['manager_feedback']) ? trim($data['manager_feedback']) : null;
    $score_technical = isset($data['score_technical']) ? (int) $data['score_technical'] : null;
    $score_impact = isset($data['score_impact']) ? (int) $data['score_impact'] : null;
    $score_leadership = isset($data['score_leadership']) ? (int) $data['score_leadership'] : null;
    $rating = isset($data['rating']) ? (int) $data['rating'] : null;
    $review_type = isset($data['review_type']) && is_string($data['review_type']) ? trim($data['review_type']) : 'annual';
    $tags = isset($data['tags']) && is_string($data['tags']) ? trim($data['tags']) : null;
    $review_date = isset($data['review_date']) && is_string($data['review_date']) ? trim($data['review_date']) : date('Y-m-d');
    $feedback_request_id = isset($data['feedback_request_id']) ? (int) $data['feedback_request_id'] : null;

    if ($score !== null) $score = max(0, min(100, $score));
    if ($score_technical !== null) $score_technical = max(0, min(100, $score_technical));
    if ($score_impact !== null) $score_impact = max(0, min(100, $score_impact));
    if ($score_leadership !== null) $score_leadership = max(0, min(100, $score_leadership));
    if ($rating !== null) $rating = max(1, min(5, $rating));
    if (!in_array($review_type, ['annual', 'mid-year', 'quarterly'], true)) $review_type = 'annual';

    $stmt = $mysqli->prepare(
        'INSERT INTO Reviews (user_id, manager_id, review_date, title, content, score, score_technical, score_impact, score_leadership, rating, manager_feedback, review_type, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $bind_types = 'ii' . 'sss' . 'iiiii' . 'sss'; // 13: user_id, manager_id, date, title, content, score×5, feedback, type, tags
    if (!$stmt || !$stmt->bind_param($bind_types, $user_id, $manager_id, $review_date, $title, $content, $score, $score_technical, $score_impact, $score_leadership, $rating, $manager_feedback, $review_type, $tags) || !$stmt->execute()) {
        if ($stmt) $stmt->close();
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $review_id = (int) $mysqli->insert_id;
    $stmt->close();

    if ($feedback_request_id > 0) {
        $stmt = $mysqli->prepare('UPDATE FeedbackRequests SET status = ? WHERE id = ? AND requested_from = ? AND requested_by = ?');
        $status = 'completed';
        if ($stmt && $stmt->bind_param('siii', $status, $feedback_request_id, $manager_id, $user_id)) {
            $stmt->execute();
            $stmt->close();
        }
    }

    echo json_encode([
        'review' => [
            'id' => $review_id,
            'user_id' => $user_id,
            'manager_id' => $manager_id,
            'title' => $title,
            'review_date' => $review_date,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
