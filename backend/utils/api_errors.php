<?php
/**
 * Safe error message for API JSON responses. Avoids leaking stack traces and paths in production.
 */
function api_error_message(Throwable $e) {
    $env = getenv('APP_ENV');
    if ($env === 'development' || $env === 'dev') {
        return $e->getMessage();
    }
    return 'An error occurred.';
}
