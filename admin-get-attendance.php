<?php
require_once 'check_admin_auth.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    // Get all attendance records with student and subject info
    $query = "
        SELECT 
            a.id,
            a.student_id,
            st.usn,
            st.name as student_name,
            s.name as subject_name,
            a.date,
            a.status
        FROM attendance a
        JOIN students st ON a.student_id = st.id
        JOIN subjects s ON a.subject_id = s.id
        ORDER BY a.date DESC, st.name, s.name
    ";

    $result = $conn->query($query);

    $attendance = [];
    while ($row = $result->fetch_assoc()) {
        $attendance[] = $row;
    }

    // Get unique subject names for filter
    $subjectQuery = "
        SELECT DISTINCT name 
        FROM subjects 
        ORDER BY name
    ";

    $subjectResult = $conn->query($subjectQuery);

    $subjects = [];
    while ($row = $subjectResult->fetch_assoc()) {
        $subjects[] = $row['name'];
    }

    $conn->close();

    echo json_encode([
        'success' => true,
        'attendance' => $attendance,
        'subjects' => $subjects
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>