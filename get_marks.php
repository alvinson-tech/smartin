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

// Get all subjects for this student
$sql = "SELECT id, name, code FROM subjects WHERE student_id = ? ORDER BY id";
$subjects_stmt = $conn->prepare($sql);
$subjects_stmt->bind_param("i", $student_id);
$subjects_stmt->execute();
$result = $subjects_stmt->get_result();

$marks_data = [];

while ($subject = $result->fetch_assoc()) {
    $subject_id = $subject['id'];

    // Get marks for this subject (IA 1, 2, 3)
    $marks_sql = "SELECT ia_number, marks_obtained, max_marks 
                  FROM marks 
                  WHERE student_id = ? AND subject_id = ?
                  ORDER BY ia_number";

    $marks_stmt = $conn->prepare($marks_sql);
    $marks_stmt->bind_param("ii", $student_id, $subject_id);
    $marks_stmt->execute();
    $marks_result = $marks_stmt->get_result();

    $ia_marks = [
        1 => null,
        2 => null,
        3 => null
    ];

    while ($mark = $marks_result->fetch_assoc()) {
        $ia_marks[$mark['ia_number']] = [
            'obtained' => $mark['marks_obtained'],
            'max' => $mark['max_marks']
        ];
    }

    $marks_data[] = [
        'subject_id' => $subject_id,
        'subject_name' => $subject['name'],
        'subject_code' => $subject['code'],
        'ia1' => $ia_marks[1],
        'ia2' => $ia_marks[2],
        'ia3' => $ia_marks[3]
    ];

    $marks_stmt->close();
}

$subjects_stmt->close();

echo json_encode([
    'success' => true,
    'marks' => $marks_data
]);

$conn->close();
?>