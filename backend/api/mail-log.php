<?php
/**
 * GET /api/mail-log.php?key=SECRET
 * Returns the last 100 lines of the mail log. Requires key from config/mail_log_secret.php or MAIL_LOG_SECRET.
 */

require_once __DIR__ . '/../utils/mailer.php';

header('Content-Type: text/plain; charset=UTF-8');

$secret = getenv('MAIL_LOG_SECRET');
if ($secret === false || $secret === '') {
    if (file_exists(__DIR__ . '/../config/mail_log_secret.php')) {
        require __DIR__ . '/../config/mail_log_secret.php';
        $secret = isset($mail_log_secret) ? $mail_log_secret : '';
    } else {
        $secret = '';
    }
}
$key = isset($_GET['key']) ? (string) $_GET['key'] : '';
if ($secret === '' || $secret === false || $key === '' || !hash_equals((string) $secret, $key)) {
    http_response_code(403);
    echo 'Forbidden.';
    return;
}

$logFile = mailer_log_path();
$tmpDir = sys_get_temp_dir();

echo "Log file: " . $logFile . "\n";
echo "temp dir: " . $tmpDir . "\n";
echo "temp dir writable: " . (is_writable($tmpDir) ? 'yes' : 'no') . "\n";
echo "mail log exists: " . (is_file($logFile) ? 'yes' : 'no') . "\n";
if (is_file($logFile)) {
    echo "mail log writable: " . (is_writable($logFile) ? 'yes' : 'no') . "\n";
}
echo "\n";

if (!is_file($logFile)) {
    echo "No mail log yet. Sign up once, then refresh. Log is in system temp (writable on shared hosts).\n";
    return;
}

$lines = [];
$fh = fopen($logFile, 'r');
if ($fh) {
    while (($line = fgets($fh)) !== false) {
        $lines[] = $line;
    }
    fclose($fh);
}
$last = array_slice($lines, -100);
echo "Last " . count($last) . " mail attempts (timestamp | to | subject | ok/fail):\n\n";
echo implode('', $last);
