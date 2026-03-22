<?php
/**
 * POST /api/contact-sales.php
 * Body: { "company": "...", "role": "...", "message": "..." }
 * Requires session. Sends confirmation to user and notification to developers.
 */

require_once __DIR__ . '/../utils/cors_headers.php';
require_once __DIR__ . '/../utils/auth_helpers.php';
require_once __DIR__ . '/../utils/api_errors.php';
require_once __DIR__ . '/../utils/mailer.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    require_session();
    $user = auth_get_user();
    $userEmail = $user['email'] ?? '';
    $userName = $user['display_name'] ?? $userEmail;

    if ($userEmail === '') {
        http_response_code(400);
        echo json_encode(['error' => 'User email not found']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        $data = [];
    }

    $company = isset($data['company']) ? trim((string) $data['company']) : '';
    $role = isset($data['role']) ? trim((string) $data['role']) : '';
    $message = isset($data['message']) ? trim((string) $data['message']) : '';

    if ($message === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Message is required']);
        return;
    }

    send_app_email_template($userEmail, 'sales_request_received', [
        'display_name' => $userName,
    ]);

    $devSubject = '[Contact Sales] ' . ($company !== '' ? $company . ' – ' : '') . 'New inquiry';
    $devPlain = "A contact sales request was submitted.\n\n"
        . "From: {$userName} <{$userEmail}>\n"
        . "Company: " . ($company !== '' ? $company : '(not provided)') . "\n"
        . "Role: " . ($role !== '' ? $role : '(not provided)') . "\n\n"
        . "Message:\n" . $message . "\n";
    $devHtml = '<p><strong>From:</strong> ' . htmlspecialchars($userName) . ' &lt;' . htmlspecialchars($userEmail) . '&gt;</p>'
        . '<p><strong>Company:</strong> ' . htmlspecialchars($company !== '' ? $company : '(not provided)') . '</p>'
        . '<p><strong>Role:</strong> ' . htmlspecialchars($role !== '' ? $role : '(not provided)') . '</p>'
        . '<div style="margin:16px 0;padding:12px;background:#f8fafc;border-radius:6px;border-left:3px solid #2563eb;"><p style="margin:0;white-space:pre-wrap;">' . htmlspecialchars($message) . '</p></div>';
    $devHtml = mailer_html_wrapper($devSubject, $devHtml);
    send_app_email_to_developers($devSubject, $devPlain, $devHtml);

    echo json_encode(['success' => true, 'message' => 'Inquiry submitted. A confirmation was sent to your email.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
