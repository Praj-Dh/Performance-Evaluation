<?php
/**
 * GET /api/get_user_details.php?id=XX
 * Fetches details of a specific employee. Requires manager or admin role.
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../utils/cors_headers.php'; // The Magic Key!

// Ensure all errors are output as JSON so you never get a blank 500 screen again
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');

try {
    // 1. Start session consistently with login.php
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // 2. Require Authentication
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not logged in']);
        exit;
    }

    // 3. Require Authorization (Manager or Admin)
    $role = $_SESSION['role'] ?? 'employee';
    if ($role !== 'manager' && $role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Management access required']);
        exit;
    }

    // 4. Validate ID
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or missing User ID']);
        exit;
    }

    // 5. Fetch User Data
    $mysqli = get_db_connection();

    $stmt = $mysqli->prepare(
    'SELECT id, email, display_name, role FROM Users WHERE id = ?'
);

    


    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database statement failed']);
        exit;
    }

    $stmt->bind_param('i', $id);
    
    // Check if execute fails
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Database execution failed']);
        exit;
    }

    $result = $stmt->get_result();
    
    // Check if get_result fails
    if (!$result) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve result set']);
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    // 6. Return Data
    if ($user) {
        echo json_encode($user);
    } else {
        http_response_code(404);
        echo json_encode(['error' => "User ID {$id} not found in database"]);
    }

} catch (Exception $e) {
    // Catch any fatal PHP errors and output them as JSON
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
} catch (Error $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Fatal PHP error: ' . $e->getMessage()]);
}