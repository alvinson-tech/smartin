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
$date = $_GET['date'] ?? '';

// Validate date
if (empty($date)) {
    echo json_encode([
        'success' => false,
        'message' => 'Date is required'
    ]);
    exit;
}

$conn = getDBConnection();

// Get attendance records for the specific date
$sql = "SELECT a.id, a.status, s.name, s.code 
        FROM attendance a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.student_id = ? AND a.date = ?
        ORDER BY s.name";

$stmt = $conn->prepare($sql);
$stmt->bind_param("is", $student_id, $date);
$stmt->execute();
$result = $stmt->get_result();

$attendance = [];
while ($row = $result->fetch_assoc()) {
    $attendance[] = [
        'attendance_id' => $row['id'],
        'subject_name' => $row['name'],
        'subject_code' => $row['code'],
        'status' => $row['status']
    ];
}

echo json_encode([
    'success' => true,
    'date' => $date,
    'attendance' => $attendance
]);

$stmt->close();
$conn->close();
?>