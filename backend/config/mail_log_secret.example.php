<?php
/**
 * Copy to mail_log_secret.php and set a secret. Then view mail log on deployed server:
 *   http://localhost:8080/api/mail-log.php?key=YOUR_SECRET
 * Not in git. Optional: use env MAIL_LOG_SECRET instead.
 */
$mail_log_secret = 'test-secret';
