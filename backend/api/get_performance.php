<?php
header('Content-Type: application/json');
require_once '../config/db_connection.php';

$data = json_decode(file_get_contents('php://input'), true);
$employee_id = $data['employee_id'] ?? 0;

try {
    $conn = get_db_connection();
    $stmt = $conn->prepare("SELECT SUM(impact_points) as total_score FROM Contributions WHERE employee_id = ?");
    $stmt->bind_param("i", $employee_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    echo json_encode(['score' => $result['total_score'] ?? 0]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>