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
$conn = getDBConnection();

// Get all subjects with attendance data for this student
$sql = "SELECT 
            s.id,
            s.name,
            s.code,
            COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) as present_count,
            COALESCE(COUNT(a.id), 0) as total_count,
            CASE 
                WHEN COUNT(a.id) > 0 THEN ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2)
                ELSE 0
            END as percentage
        FROM subjects s
        LEFT JOIN attendance a ON s.id = a.subject_id AND a.student_id = ?
        WHERE s.student_id = ?
        GROUP BY s.id, s.name, s.code
        ORDER BY s.id";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $student_id, $student_id);
$stmt->execute();
$result = $stmt->get_result();

$subjects = [];
$total_present = 0;
$total_classes = 0;

while ($row = $result->fetch_assoc()) {
    $subjects[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'code' => $row['code'],
        'percentage' => floatval($row['percentage']),
        'present_count' => intval($row['present_count']),
        'total_count' => intval($row['total_count'])
    ];

    $total_present += $row['present_count'];
    $total_classes += $row['total_count'];
}

// Calculate overall attendance
$overall = $total_classes > 0 ? round(($total_present / $total_classes) * 100, 2) : 0;

echo json_encode([
    'success' => true,
    'overall' => $overall,
    'subjects' => $subjects
]);

$stmt->close();
$conn->close();
?>