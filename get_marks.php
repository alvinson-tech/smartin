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

// Get all subjects for this student, excluding labs and non-graded subjects
// Excluded: Lab subjects, Library, PE, ITT, and Remedial classes
$sql = "SELECT id, name, code FROM subjects 
        WHERE student_id = ? 
        AND name NOT LIKE '%Lab%' 
        AND name != 'Library' 
        AND name != 'Physical Education (PE)'
        AND name != 'Integrated Technical Coding (ITT)'
        AND code NOT LIKE '%(R)%'
        AND name NOT LIKE '%Remedial%'
        ORDER BY id";
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

// Custom ordering function
function getSubjectOrder($subject)
{
    $name = $subject['subject_name'];
    $code = $subject['subject_code'];

    // Define the order priority
    if (strpos($name, 'Cloud Computing & Full Stack') !== false)
        return 1;
    if (strpos($name, 'Machine Learning') !== false && strpos($name, 'Lab') === false)
        return 2;
    if (strpos($name, 'Blockchain Technology') !== false && strpos($code, '(R)') === false)
        return 3;
    if (strpos($name, 'Indian Knowledge System') !== false)
        return 4;

    // Open Elective - any subject with AE code (except specific ones) or similar patterns
    if (strpos($code, 'MVJ22AE') !== false || strpos($name, 'Airline') !== false)
        return 5;

    // AEC Vertical - subjects with A6 or similar vertical codes
    if (strpos($code, 'MVJ22A6') !== false || strpos($name, 'AEC Vertical') !== false)
        return 6;

    // Major Project
    if (strpos($name, 'Major Project') !== false)
        return 7;

    // Default - any other subject
    return 8;
}

// Sort the marks data according to custom order
usort($marks_data, function ($a, $b) {
    return getSubjectOrder($a) - getSubjectOrder($b);
});

echo json_encode([
    'success' => true,
    'marks' => $marks_data
]);

$conn->close();
?>