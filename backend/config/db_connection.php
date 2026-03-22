<?php
/**
 * MySQLi database connection for CSE 442 - Team Fantastic 5
 * Server/Local: hostname localhost, database cse442_2026_spring_team_p_db
 * Login = username, Password = password
 *
 * Credentials (in order of precedence):
 * 1. config/db_local.php (if present) - set $db_host, $db_user, $db_pass, $db_name. Not in git.
 * 2. Environment variables DB_HOST, DB_USER, DB_PASS, DB_NAME
 * 3. Defaults below (password empty = will fail on server until you add db_local.php)
 */

function get_db_connection() {
    static $mysqli = null;
    if ($mysqli !== null) {
        return $mysqli;
    }
    $host     = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'ksg_local';
    $port     = 3306;

    if (file_exists(__DIR__ . '/db_local.php')) {
        require __DIR__ . '/db_local.php';
        if (isset($db_host)) { $host = $db_host; }
        if (isset($db_user)) { $username = $db_user; }
        if (isset($db_pass)) { $password = $db_pass; }
        if (isset($db_name)) { $database = $db_name; }
        if (isset($db_port)) { $port = (int) $db_port; }
    } else {
        $host     = getenv('DB_HOST') ?: $host;
        $username = getenv('DB_USER') ?: $username;
        $password = getenv('DB_PASS') ?: $password;
        $database = getenv('DB_NAME') ?: $database;
        $port     = (int) (getenv('DB_PORT') ?: $port);
    }

    $mysqli = new mysqli($host, $username, $password, $database, $port);
    if ($mysqli->connect_error) {
        header('Content-Type: application/json');
        $msg = (getenv('APP_ENV') === 'development' || getenv('APP_ENV') === 'dev')
            ? 'Database connection failed: ' . $mysqli->connect_error
            : 'Database connection failed.';
        echo json_encode(['error' => $msg]);
        exit;
    }
    $mysqli->set_charset('utf8mb4');
    return $mysqli;
}
