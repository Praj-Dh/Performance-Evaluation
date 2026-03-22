<?php
/**
 * GET /api/reviews.php
 * Returns reviews for the current session user, including manager info.
 * Supports Performance History page (score, manager_feedback, review_type, tags).
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

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        return;
    }

    $user_id = (int) $_SESSION['user_id'];
    $mysqli = get_db_connection();

    // Fetch reviews with LEFT JOIN to get manager display_name and role
    $sql = <<<'SQL'
SELECT
    r.id,
    r.user_id,
    r.manager_id,
    r.review_date,
    r.title,
    r.content,
    r.score,
    r.score_technical,
    r.score_impact,
    r.score_leadership,
    r.rating,
    r.manager_feedback,
    r.review_type,
    r.tags,
    r.created_at,
    r.updated_at,
    m.display_name AS manager_name,
    m.role          AS manager_role
FROM Reviews r
LEFT JOIN Users m ON r.manager_id = m.id
WHERE r.user_id = ?
ORDER BY COALESCE(r.review_date, r.created_at) DESC
SQL;

    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        return;
    }
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $reviews = [];
    while ($row = $result->fetch_assoc()) {
        $reviews[] = [
            'id'               => (int) $row['id'],
            'user_id'          => (int) $row['user_id'],
            'manager_id'       => $row['manager_id'] !== null ? (int) $row['manager_id'] : null,
            'review_date'      => $row['review_date'],
            'title'            => $row['title'],
            'content'          => $row['content'],
            'score'            => $row['score'] !== null ? (int) $row['score'] : null,
            'score_technical'  => $row['score_technical'] !== null ? (int) $row['score_technical'] : null,
            'score_impact'     => $row['score_impact'] !== null ? (int) $row['score_impact'] : null,
            'score_leadership' => $row['score_leadership'] !== null ? (int) $row['score_leadership'] : null,
            'rating'           => $row['rating'] !== null ? (int) $row['rating'] : null,
            'manager_feedback' => $row['manager_feedback'],
            'review_type'      => $row['review_type'],
            'tags'             => $row['tags'],
            'created_at'       => $row['created_at'],
            'updated_at'       => $row['updated_at'],
            'manager_name'     => $row['manager_name'],
            'manager_role'     => $row['manager_role'],
        ];
    }
    $stmt->close();

    // Compute summary stats
    $scored = array_filter($reviews, fn($r) => $r['score'] !== null);
    $avg_score = count($scored) > 0
        ? round(array_sum(array_map(fn($r) => $r['score'], $scored)) / count($scored))
        : null;

    echo json_encode([
        'reviews'       => $reviews,
        'total_reviews' => count($reviews),
        'avg_score'     => $avg_score,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
