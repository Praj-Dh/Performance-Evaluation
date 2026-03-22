<?php
/**
 * POST /api/contact-support.php
 * Body: { "category": "...", "subject": "...", "message": "..." }
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

    $category = isset($data['category']) ? trim((string) $data['category']) : 'general';
    $subject = isset($data['subject']) ? trim((string) $data['subject']) : '';
    $message = isset($data['message']) ? trim((string) $data['message']) : '';

    $allowedCategories = ['general', 'technical', 'account', 'feedback'];
    if (!in_array($category, $allowedCategories, true)) {
        $category = 'general';
    }

    if ($message === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Message is required']);
        return;
    }

    $subjectLine = $subject !== '' ? $subject : 'Support request';
    $categoryLabel = ucfirst($category);

    send_app_email_template($userEmail, 'support_request_received', [
        'display_name' => $userName,
    ]);

    $devSubject = "[Support Request] {$categoryLabel}: " . (mb_strlen($subjectLine) > 50 ? mb_substr($subjectLine, 0, 47) . '...' : $subjectLine);
    $devPlain = "A support request was submitted.\n\n"
        . "From: {$userName} <{$userEmail}>\n"
        . "Category: {$categoryLabel}\n"
        . "Subject: {$subjectLine}\n\n"
        . "Message:\n" . $message . "\n";
    $devHtml = '<p><strong>From:</strong> ' . htmlspecialchars($userName) . ' &lt;' . htmlspecialchars($userEmail) . '&gt;</p>'
        . '<p><strong>Category:</strong> ' . htmlspecialchars($categoryLabel) . '</p>'
        . '<p><strong>Subject:</strong> ' . htmlspecialchars($subjectLine) . '</p>'
        . '<div style="margin:16px 0;padding:12px;background:#f8fafc;border-radius:6px;border-left:3px solid #2563eb;"><p style="margin:0;white-space:pre-wrap;">' . htmlspecialchars($message) . '</p></div>';
    $devHtml = mailer_html_wrapper($devSubject, $devHtml);
    send_app_email_to_developers($devSubject, $devPlain, $devHtml);

    echo json_encode(['success' => true, 'message' => 'Support request submitted. A confirmation was sent to your email.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => api_error_message($e)]);
}
