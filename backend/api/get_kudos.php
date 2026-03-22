<?php
header('Content-Type: application/json');
require_once '../config/db_connection.php';

try {
    $conn = get_db_connection();
    $query = "SELECT reviewer_id as from_user, review_text as message FROM Reviews ORDER BY created_at DESC LIMIT 3";
    $result = $conn->query($query);
    
    $kudos = [];
    while($row = $result->fetch_assoc()) {
        $kudos[] = $row;
    }
    
    echo json_encode(['kudos' => $kudos]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>