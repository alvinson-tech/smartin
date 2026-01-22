<?php
require_once 'check_admin_auth.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    $query = "
        SELECT 
            s.student_id,
            st.usn,
            st.name as student_name,
            s.name as subject_name,
            s.code as subject_code
        FROM subjects s
        JOIN students st ON s.student_id = st.id
        ORDER BY st.name, s.name
    ";

    $result = $conn->query($query);

    $subjects = [];
    while ($row = $result->fetch_assoc()) {
        $subjects[] = $row;
    }

    $conn->close();

    echo json_encode([
        'success' => true,
        'subjects' => $subjects
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>