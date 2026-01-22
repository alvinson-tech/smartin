<?php
require_once 'check_admin_auth.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    $query = "
        SELECT usn, name, semester, college, created_at 
        FROM students 
        ORDER BY created_at DESC
    ";

    $result = $conn->query($query);

    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }

    $conn->close();

    echo json_encode([
        'success' => true,
        'students' => $students
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>