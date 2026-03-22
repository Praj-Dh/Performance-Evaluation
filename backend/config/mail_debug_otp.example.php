<?php
/**
 * Copy this file to mail_debug_otp.php to enable returning the verification OTP in the API response.
 * Use on production servers when mail() returns "ok" but emails never arrive (server relay/spam issue).
 * Then signup and resend-verification will include dev_otp in the JSON; the verify-email page will prefill it from the URL.
 * Do not enable in production if you don't want OTPs in API responses.
 */
// File can be empty; existence triggers mailer_should_return_otp_in_response().
