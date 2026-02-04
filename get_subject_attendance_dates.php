<?php
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);
    exit;
}

$student_id = $_SESSION['student_id'];
$subject_id = $_GET['subject_id'] ?? '';

// Validate subject_id
if (empty($subject_id)) {
    echo json_encode([
        'success' => false,
        'message' => 'Subject ID is required'
    ]);
    exit;
}

$conn = getDBConnection();

// First, verify that this subject belongs to the logged-in student
$verify_sql = "SELECT id, name, code FROM subjects WHERE id = ? AND student_id = ?";
$verify_stmt = $conn->prepare($verify_sql);
$verify_stmt->bind_param("ii", $subject_id, $student_id);
$verify_stmt->execute();
$verify_result = $verify_stmt->get_result();

if ($verify_result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Subject not found or access denied'
    ]);
    $verify_stmt->close();
    $conn->close();
    exit;
}

$subject_info = $verify_result->fetch_assoc();
$verify_stmt->close();

// Get all attendance dates for this subject
$sql = "SELECT a.date, a.status, a.id
        FROM attendance a
        WHERE a.student_id = ? AND a.subject_id = ?
        ORDER BY a.date DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $student_id, $subject_id);
$stmt->execute();
$result = $stmt->get_result();

$attendance_dates = [];
while ($row = $result->fetch_assoc()) {
    $attendance_dates[] = [
        'attendance_id' => $row['id'],
        'date' => $row['date'],
        'status' => $row['status']
    ];
}

echo json_encode([
    'success' => true,
    'subject_name' => $subject_info['name'],
    'subject_code' => $subject_info['code'],
    'attendance_dates' => $attendance_dates
]);

$stmt->close();
$conn->close();
?>