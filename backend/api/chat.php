<?php
/**
 * GET /api/chat.php?user_id=1&peer_id=2 -> Fetches conversation history
 * POST /api/chat.php -> Saves a new message
 */

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../utils/cors_headers.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $mysqli = get_db_connection();

    // ==========================================
    // GET: FETCH CHAT HISTORY
    // ==========================================
    if ($method === 'GET') {
        $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
        $peer_id = isset($_GET['peer_id']) ? (int)$_GET['peer_id'] : 0;

        if (!$user_id || !$peer_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing user_id or peer_id']);
            return;
        }

        // Fix 1: Generate the custom conversation_id the database expects
        $smaller = min($user_id, $peer_id);
        $larger = max($user_id, $peer_id);
        $conversation_id = $smaller . '_' . $larger;

        // Fix 2: Alias 'sent_at' to 'created_at' so your React frontend doesn't break
        $stmt = $mysqli->prepare("
            SELECT id, sender_id, receiver_id, message, sent_at AS created_at 
            FROM Chat 
            WHERE conversation_id = ? 
            ORDER BY id ASC
        ");
        
        $stmt->bind_param('s', $conversation_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $messages = [];
        while ($row = $result->fetch_assoc()) {
            $messages[] = $row;
        }
        $stmt->close();
        
        echo json_encode(['success' => true, 'messages' => $messages]);
    } 
    
    // ==========================================
    // POST: SEND A NEW MESSAGE
    // ==========================================
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sender_id = isset($data['sender_id']) ? (int)$data['sender_id'] : 0;
        $receiver_id = isset($data['receiver_id']) ? (int)$data['receiver_id'] : 0;
        $message = isset($data['message']) ? trim($data['message']) : '';

        if (!$sender_id || !$receiver_id || $message === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Missing sender_id, receiver_id, or message text']);
            return;
        }

        // Fix 1: Generate the custom conversation_id
        $smaller = min($sender_id, $receiver_id);
        $larger = max($sender_id, $receiver_id);
        $conversation_id = $smaller . '_' . $larger;
        
        // Fix 3: Calculate message length for the database
        $message_length = strlen($message);

        // Insert with the exact columns your database demands
        $stmt = $mysqli->prepare("INSERT INTO Chat (conversation_id, sender_id, receiver_id, message, message_length) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param('siisi', $conversation_id, $sender_id, $receiver_id, $message, $message_length);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true, 
                'message' => 'Message sent',
                'chat_id' => $mysqli->insert_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: Failed to save message']);
        }
        $stmt->close();
    } 
    
    else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal Server Error']);
}