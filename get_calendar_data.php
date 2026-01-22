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
$year = $_GET['year'] ?? date('Y');
$month = $_GET['month'] ?? date('m');

// Validate input
if (!is_numeric($year) || !is_numeric($month)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid year or month'
    ]);
    exit;
}

$conn = getDBConnection();

// Get attendance counts for each day in the month, separated by status
$sql = "SELECT DATE(date) as attendance_date, 
               status,
               COUNT(*) as count
        FROM attendance
        WHERE student_id = ? 
        AND YEAR(date) = ? 
        AND MONTH(date) = ?
        GROUP BY DATE(date), status";

$stmt = $conn->prepare($sql);
$stmt->bind_param("iii", $student_id, $year, $month);
$stmt->execute();
$result = $stmt->get_result();

$attendance_data = [];
while ($row = $result->fetch_assoc()) {
    $date = $row['attendance_date'];
    if (!isset($attendance_data[$date])) {
        $attendance_data[$date] = ['present' => 0, 'absent' => 0];
    }
    $attendance_data[$date][$row['status']] = (int) $row['count'];
}

echo json_encode([
    'success' => true,
    'year' => (int) $year,
    'month' => (int) $month,
    'attendance_data' => $attendance_data
]);

$stmt->close();
$conn->close();
?>