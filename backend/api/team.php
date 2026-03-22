<?php
// Set the content type to JSON so the frontend can parse it correctly
header('Content-Type: application/json');

// Database credentials from your project email
$host = "localhost"; 
$user = "jiyaadbh"; 
$pass = "50425601"; 
$db   = "cse442_2026_spring_team_p_db"; // DA team's database name

// Create connection to the MySQL server
$conn = mysqli_connect($host, $user, $pass, $db);

// Check if the connection was successful
if (!$conn) {
    echo json_encode(["error" => "Connection failed: " . mysqli_connect_error()]);
    exit;
}

// SQL query to fetch all members from your team_members table
$sql = "SELECT * FROM team_members";
$result = mysqli_query($conn, $sql);
$team = [];

if ($result) {
    while($row = mysqli_fetch_assoc($result)) {
        $team[] = $row;
    }
}


echo json_encode($team);

mysqli_close($conn);
?>