<?php
require_once 'config.php';

header('Content-Type: application/json');
// Cache user info for 5 minutes
header('Cache-Control: private, max-age=300');

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);
    exit;
}

$student_id = $_SESSION['student_id'];
$conn = getDBConnection();

// Get student information including fingerprint status
$sql = "SELECT usn, username, name, semester, college, fingerprint_credentials, fingerprint_prompted FROM students WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $student = $result->fetch_assoc();

    // Check fingerprint status
    $has_fingerprint = !empty($student['fingerprint_credentials']);
    $fingerprint_prompted = (bool) $student['fingerprint_prompted'];

    echo json_encode([
        'success' => true,
        'student' => [
            'usn' => $student['usn'],
            'username' => $student['username'],
            'name' => $student['name'],
            'semester' => $student['semester'],
            'college' => $student['college'],
            'has_fingerprint' => $has_fingerprint,
            'fingerprint_prompted' => $fingerprint_prompted
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Student not found'
    ]);
}

$stmt->close();
$conn->close();
?>