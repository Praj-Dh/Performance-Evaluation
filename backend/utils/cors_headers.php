<?php
/**
 * CORS headers to allow React dev server (and production frontend) to call the API.
 */

$allowed_origin = isset($_SERVER['HTTP_ORIGIN'])
    ? $_SERVER['HTTP_ORIGIN']
    : 'http://localhost:3000';
// Restrict to known dev/prod origins in production
$allowed_origins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
if (in_array($allowed_origin, $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . $allowed_origin);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
