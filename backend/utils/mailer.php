<?php
/**
 * App mailer: reactive base URL and From per server (local = dev, server = prod).
 * Use send_app_email() or send_app_email_template() for all user-facing emails.
 *
 * Server detection: HTTP_HOST (local.example.com vs server.example.com)
 *                   or APP_ENV (development => local, production => server).
 * Override with env: APP_BASE_URL, MAIL_FROM.
 *
 * Templates:
 *   welcome          - Signup confirmation (data: display_name)
 *   password_reset   - Reset link (data: reset_url)
 *   password_changed - After change-password (data: none)
 *   account_update   - Generic update (data: subject?, message)
 *   feedback_request - Employee requested feedback (data: manager_display_name, requester_name, message?, write_review_url)
 *
 * For custom emails use send_app_email($to, $subject, $bodyPlain, $bodyHtml).
 */

const MAILER_LOCAL_BASE = 'http://localhost:3000';
const MAILER_LOCAL_FROM = 'noreply@localhost';

/** Developer list for support/sales request notifications (BCC or To). */
const MAILER_DEVELOPER_EMAILS = [
    'developer1@example.com',
    'developer2@example.com',
    'developer3@example.com',
    'developer4@example.com',
    'developer5@example.com',
];

/**
 * Simplify logic for local-only deployment.
 */

/**
 * Base URL of the app (no trailing slash). Local default.
 */
function get_app_base_url() {
    $url = getenv('APP_BASE_URL');
    if (!empty($url)) {
        return rtrim($url, '/');
    }
    return MAILER_LOCAL_BASE;
}

/**
 * From address for outgoing mail. Local default.
 */
function get_mail_from() {
    $from = getenv('MAIL_FROM');
    if (!empty($from)) {
        return $from;
    }
    return MAILER_LOCAL_FROM;
}

/**
 * Whether to capture outgoing mail to files (development). Set MAIL_CAPTURE=1 or APP_ENV=development.
 */
function mailer_should_capture() {
    if (getenv('MAIL_CAPTURE') === '1' || getenv('MAIL_CAPTURE') === 'true') {
        return true;
    }
    $env = getenv('APP_ENV');
    if ($env === 'development' || $env === 'dev') {
        return true;
    }
    $host = isset($_SERVER['HTTP_HOST']) ? strtolower($_SERVER['HTTP_HOST']) : '';
    return ($host === 'localhost' || strpos($host, '127.0.0.1') !== false);
}

/**
 * When true, signup/resend-verification include the OTP in the JSON response so you can test
 * when the server accepts mail() but doesn't deliver (e.g. local/server). Set MAIL_DEBUG_OTP=1 or create config/mail_debug_otp.php.
 */
function mailer_should_return_otp_in_response() {
    if (getenv('MAIL_DEBUG_OTP') === '1' || getenv('MAIL_DEBUG_OTP') === 'true') {
        return true;
    }
    if (file_exists(__DIR__ . '/../config/mail_debug_otp.php')) {
        return true;
    }
    $host = isset($_SERVER['HTTP_HOST']) ? strtolower($_SERVER['HTTP_HOST']) : '';
    return ($host === 'localhost' || strpos($host, '127.0.0.1') !== false);
}

/**
 * Path to mail log file. Use system temp dir so it's writable on shared servers where config/ may not be.
 */
function mailer_log_path() {
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . '/cse442p-mail.log';
}

/**
 * Append a raw line to the mail log (for diagnostics).
 */
function mailer_log_line($line) {
    $path = mailer_log_path();
    @file_put_contents($path, $line . "\n", FILE_APPEND | LOCK_EX);
}

/**
 * Append one line to the mail log (for debugging on deployed server). No sensitive data.
 * View via GET /api/mail-log.php
 */
function mailer_log_attempt($to, $subject, $ok) {
    $path = mailer_log_path();
    $line = date('Y-m-d H:i:s') . ' | ' . $to . ' | ' . str_replace(["\n", "|"], [' ', ''], $subject) . ' | ' . ($ok ? 'ok' : 'fail') . "\n";
    @file_put_contents($path, $line, FILE_APPEND | LOCK_EX);
}

/**
 * Capture email to a file (for local dev when mail() doesn't deliver). Returns path if written.
 */
function mailer_capture_to_file($to, $subject, $bodyPlain, $bodyHtml = '') {
    $dir = getenv('MAIL_CAPTURE_DIR');
    if ($dir === '' || $dir === false) {
        $dir = __DIR__ . '/../.mail-capture';
    }
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        return null;
    }
    $safe = preg_replace('/[^a-z0-9@._-]/i', '_', $to . '_' . $subject);
    $safe = substr($safe, 0, 80);
    $path = $dir . '/' . date('Y-m-d_H-i-s') . '_' . $safe . '.txt';
    $content = "To: {$to}\nSubject: {$subject}\n\n" . $bodyPlain;
    if (@file_put_contents($path, $content) !== false) {
        return $path;
    }
    return null;
}

/**
 * Send an app email (HTML + plain text). Use for signup, reset, notifications.
 * In development, also captures to .mail-capture/ so you can read the OTP if mail() doesn't deliver.
 *
 * @param string $to      Recipient email
 * @param string $subject Subject line
 * @param string $bodyPlain Plain-text body (required for accessibility)
 * @param string $bodyHtml HTML body (optional; if empty, plain only)
 * @param array $bcc Optional list of BCC email addresses
 * @return bool True if mail() accepted the message (or capture succeeded in dev)
 */
function send_app_email($to, $subject, $bodyPlain, $bodyHtml = '', array $bcc = []) {
    mailer_log_line(date('Y-m-d H:i:s') . ' | START | ' . $to . ' | ' . str_replace(["\n", "|"], [' ', ''], $subject));

    $from = get_mail_from();
    $fromHeader = 'From: ' . $from . "\r\n";
    $bccHeader = !empty($bcc) ? 'Bcc: ' . implode(', ', $bcc) . "\r\n" : '';

    if (mailer_should_capture()) {
        $captured = mailer_capture_to_file($to, $subject, $bodyPlain, $bodyHtml);
        if ($captured) {
            error_log("[Mail] Captured to {$captured} (To: {$to}, Subject: {$subject})");
        }
    }

    if (empty($bodyHtml)) {
        $headers = $fromHeader . $bccHeader . "Content-Type: text/plain; charset=UTF-8\r\n";
        $ok = @mail($to, $subject, $bodyPlain, $headers);
        mailer_log_attempt($to, $subject, $ok);
        if (!$ok && mailer_should_capture()) {
            error_log("[Mail] mail() failed for {$to} - check .mail-capture/ for content");
        }
        return $ok;
    }

    $boundary = '----=_Part_' . md5(uniqid((string) mt_rand(), true));
    $headers = $fromHeader . $bccHeader
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

    $body = "--{$boundary}\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 7bit\r\n\r\n"
        . $bodyPlain
        . "\r\n--{$boundary}\r\n"
        . "Content-Type: text/html; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 7bit\r\n\r\n"
        . $bodyHtml
        . "\r\n--{$boundary}--";

    $ok = @mail($to, $subject, $body, $headers);
    mailer_log_attempt($to, $subject, $ok);
    if (!$ok && mailer_should_capture()) {
        error_log("[Mail] mail() failed for {$to} - check .mail-capture/ for content");
    }
    return $ok;
}

/**
 * Build and send a templated email. Templates: welcome, password_reset, account_update.
 * $data is template-specific (e.g. display_name, reset_url, message).
 *
 * @param string $to     Recipient email
 * @param string $template Template key
 * @param array  $data   Template variables
 * @return bool
 */
function send_app_email_template($to, $template, array $data = []) {
    $base = get_app_base_url();
    $appName = 'PerformancePlatform';

    switch ($template) {
        case 'welcome':
            $displayName = isset($data['display_name']) ? $data['display_name'] : '';
            $firstName = $displayName ? trim(explode(' ', trim($displayName))[0]) : 'there';
            $subject = "Welcome to {$appName}";
            $plain = "Hi " . $firstName . ",\n\nWelcome to PerformancePlatform. Your email is verified and your account is ready.\n\nSign in: " . $base . "/\n\n— The PerformancePlatform team\n";
            $signInUrl = $base . '/';
            $html = mailer_html_wrapper(
                $subject,
                '<p style="margin:0 0 16px;">Hi ' . htmlspecialchars($firstName) . ',</p>'
                . '<p style="margin:0 0 20px;">Welcome to PerformancePlatform. Your email is verified and your account is ready—sign in below to get started.</p>'
                . mailer_btn_primary($signInUrl, 'Sign in')
                . '<p style="margin:20px 0 0;font-size:13px;color:#64748b;">Or copy this link: <a href="' . htmlspecialchars($signInUrl) . '" style="color:#2563eb;">' . htmlspecialchars($signInUrl) . '</a></p>'
            );
            return send_app_email($to, $subject, $plain, $html);

        case 'password_reset':
            $resetUrl = isset($data['reset_url']) ? $data['reset_url'] : ($base . '/reset-password?token=' . (isset($data['token']) ? $data['token'] : ''));
            $subject = "Reset your password";
            $plain = "Password reset requested.\n\nOpen this link (1 hour):\n" . $resetUrl . "\n\nIf you did not request this, ignore this email.\n\nPerformancePlatform\n";
            $html = mailer_html_wrapper($subject, '<p>Password reset requested.</p>' . mailer_btn_primary($resetUrl, 'Set new password') . '<p>Or copy: ' . htmlspecialchars($resetUrl) . '</p><p style="color:#666;font-size:13px;">If you did not request this, ignore this email.</p>');
            return send_app_email($to, $subject, $plain, $html);

        case 'account_update':
            $message = isset($data['message']) ? $data['message'] : 'Your account has been updated.';
            $subject = isset($data['subject']) ? $data['subject'] : "{$appName} – account update";
            $plain = $message . "\n\nPerformancePlatform\n";
            $html = mailer_html_wrapper($subject, '<p>' . nl2br(htmlspecialchars($message)) . '</p>');
            return send_app_email($to, $subject, $plain, $html);

        case 'password_changed':
            $subject = "Password changed";
            $plain = "Your password was changed. If you did not do this, contact support.\n\nPerformancePlatform\n";
            $html = mailer_html_wrapper($subject, '<p>Your password was changed. If you did not do this, please contact support.</p>');
            return send_app_email($to, $subject, $plain, $html);

        case 'email_verification':
            $otp = isset($data['otp']) ? $data['otp'] : '';
            $displayName = isset($data['display_name']) ? $data['display_name'] : '';
            $firstName = $displayName ? explode(' ', trim($displayName))[0] : 'there';
            $subject = "Verify your email";
            $plain = "Hi " . $firstName . ",\n\nYour verification code: " . $otp . "\n\nEnter it on the verification page. Code expires in 15 minutes.\n\nPerformancePlatform\n";
            $html = mailer_html_wrapper($subject, '<p>Hi ' . htmlspecialchars($firstName) . ',</p><p>Your verification code:</p>' . mailer_otp_box($otp) . '<p>Enter it on the verification page. Expires in 15 minutes.</p>');
            return send_app_email($to, $subject, $plain, $html);

        case 'password_reset_otp':
            $otp = isset($data['otp']) ? $data['otp'] : '';
            $subject = "Password reset code";
            $plain = "Your reset code: " . $otp . "\n\nEnter it on the reset password page. Code expires in 15 minutes.\n\nIf you did not request this, ignore this email.\n\nPerformancePlatform\n";
            $html = mailer_html_wrapper($subject, '<p>Your password reset code:</p>' . mailer_otp_box($otp) . '<p>Enter it on the reset password page. Expires in 15 minutes.</p><p style="color:#666;font-size:13px;">If you did not request this, ignore this email.</p>');
            return send_app_email($to, $subject, $plain, $html);

        case 'feedback_request':
            $managerDisplayName = isset($data['manager_display_name']) ? trim($data['manager_display_name']) : 'Manager';
            $requesterName = isset($data['requester_name']) ? trim($data['requester_name']) : 'An employee';
            $message = isset($data['message']) && is_string($data['message']) ? trim($data['message']) : '';
            $writeReviewUrl = isset($data['write_review_url']) ? $data['write_review_url'] : $base . '/write-review';
            $firstName = $managerDisplayName ? trim(explode(' ', $managerDisplayName)[0]) : 'there';
            $subject = "Feedback requested by " . $requesterName . " – PerformancePlatform";
            $plain = "Hi " . $firstName . ",\n\n"
                . $requesterName . " has requested feedback from you for their performance review.\n\n";
            if ($message !== '') {
                $plain .= "Their message:\n" . $message . "\n\n";
            }
            $plain .= "You can write their review here:\n" . $writeReviewUrl . "\n\n"
                . "— PerformancePlatform\n";
            $html = '<p style="margin:0 0 16px;">Hi ' . htmlspecialchars($firstName) . ',</p>'
                . '<p style="margin:0 0 16px;"><strong>' . htmlspecialchars($requesterName) . '</strong> has requested feedback from you for their performance review.</p>';
            if ($message !== '') {
                $html .= '<div style="margin:0 0 16px;padding:12px;background:#f8fafc;border-radius:6px;border-left:3px solid #2563eb;"><p style="margin:0;font-size:14px;color:#475569;">' . nl2br(htmlspecialchars($message)) . '</p></div>';
            }
            $html .= '<p style="margin:0 0 20px;">Click below to write their review.</p>'
                . mailer_btn_primary($writeReviewUrl, 'Write review')
                . '<p style="margin:20px 0 0;font-size:13px;color:#64748b;">Or copy this link: <a href="' . htmlspecialchars($writeReviewUrl) . '" style="color:#2563eb;">' . htmlspecialchars($writeReviewUrl) . '</a></p>';
            $html = mailer_html_wrapper($subject, $html);
            return send_app_email($to, $subject, $plain, $html);

        case 'support_request_received':
            $displayName = isset($data['display_name']) ? trim($data['display_name']) : 'there';
            $firstName = $displayName ? trim(explode(' ', $displayName)[0]) : 'there';
            $subject = "We received your support request – PerformancePlatform";
            $plain = "Hi " . $firstName . ",\n\nWe've received your support request and will get back to you within 1–2 business days.\n\n— The PerformancePlatform team\n";
            $html = mailer_html_wrapper($subject, '<p style="margin:0 0 16px;">Hi ' . htmlspecialchars($firstName) . ',</p><p style="margin:0 0 20px;">We\'ve received your support request and will get back to you within 1–2 business days.</p><p style="margin:0;">— The PerformancePlatform team</p>');
            return send_app_email($to, $subject, $plain, $html);

        case 'sales_request_received':
            $displayName = isset($data['display_name']) ? trim($data['display_name']) : 'there';
            $firstName = $displayName ? trim(explode(' ', $displayName)[0]) : 'there';
            $subject = "We received your inquiry – PerformancePlatform";
            $plain = "Hi " . $firstName . ",\n\nWe've received your contact sales request and will get back to you within 1–2 business days.\n\n— The PerformancePlatform team\n";
            $html = mailer_html_wrapper($subject, '<p style="margin:0 0 16px;">Hi ' . htmlspecialchars($firstName) . ',</p><p style="margin:0 0 20px;">We\'ve received your inquiry and will get back to you within 1–2 business days.</p><p style="margin:0;">— The PerformancePlatform team</p>');
            return send_app_email($to, $subject, $plain, $html);

        default:
            return false;
    }
}

/**
 * Light minimal email: white card, thin blue accent bar, no dark header.
 */
function mailer_html_wrapper($title, $content) {
    $appName = 'PerformancePlatform';
    $year = date('Y');
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<title>' . htmlspecialchars($title) . '</title></head>'
        . '<body style="margin:0;padding:0;background:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:16px;line-height:1.5;color:#334155;">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e2e8f0;"><tr><td style="padding:40px 20px;">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #cbd5e1;overflow:hidden;">'
        . '<tr><td style="height:4px;background:#2563eb;"></td></tr>'
        . '<tr><td style="padding:24px 28px 0;"><span style="font-size:18px;font-weight:600;color:#0f172a;">' . htmlspecialchars($appName) . '</span></td></tr>'
        . '<tr><td style="padding:20px 28px 28px;font-size:15px;line-height:1.6;">' . $content . '</td></tr>'
        . '<tr><td style="padding:12px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">&copy; ' . $year . ' ' . htmlspecialchars($appName) . '</td></tr>'
        . '</table></td></tr></table></body></html>';
}

function mailer_btn_primary($url, $label) {
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;"><tr><td style="padding:0;"><a href="' . htmlspecialchars($url) . '" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;font-weight:600;font-size:14px;border-radius:6px;">' . htmlspecialchars($label) . '</a></td></tr></table>';
}

function mailer_otp_box($otp) {
    return '<p style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:6px;text-align:center;"><span style="font-size:24px;font-weight:700;letter-spacing:3px;color:#0f172a;">' . htmlspecialchars($otp) . '</span></p>';
}

/**
 * Send an email to the developer list (support/sales request notifications).
 * Sends to first developer with BCC to the rest.
 *
 * @param string $subject Subject line
 * @param string $bodyPlain Plain-text body
 * @param string $bodyHtml HTML body (optional)
 * @return bool True if mail() accepted the message
 */
function send_app_email_to_developers($subject, $bodyPlain, $bodyHtml = '') {
    $emails = MAILER_DEVELOPER_EMAILS;
    if (empty($emails)) {
        return false;
    }
    $to = $emails[0];
    $bcc = array_slice($emails, 1);
    return send_app_email($to, $subject, $bodyPlain, $bodyHtml, $bcc);
}
