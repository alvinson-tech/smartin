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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $student_id = $_SESSION['student_id'];
    $subject_id = $_POST['subject_id'] ?? 0;
    $ia_number = $_POST['ia_number'] ?? 0;
    $marks_obtained = $_POST['marks_obtained'] ?? null;

    // Validate input
    if ($subject_id <= 0 || !in_array($ia_number, [1, 2, 3])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input'
        ]);
        exit;
    }

    // Validate marks (should be between 0 and 50, or null to clear)
    if ($marks_obtained !== null && $marks_obtained !== '') {
        $marks_obtained = floatval($marks_obtained);
        if ($marks_obtained < 0 || $marks_obtained > 50) {
            echo json_encode([
                'success' => false,
                'message' => 'Marks should be between 0 and 50'
            ]);
            exit;
        }
    } else {
        $marks_obtained = null;
    }

    $conn = getDBConnection();

    // Insert or update marks
    if ($marks_obtained === null) {
        // Delete the record if marks are cleared
        $sql = "DELETE FROM marks WHERE student_id = ? AND subject_id = ? AND ia_number = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $student_id, $subject_id, $ia_number);
    } else {
        // Insert or update marks
        $sql = "INSERT INTO marks (student_id, subject_id, ia_number, marks_obtained, max_marks) 
                VALUES (?, ?, ?, ?, 50)
                ON DUPLICATE KEY UPDATE marks_obtained = ?, updated_at = CURRENT_TIMESTAMP";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iiidi", $student_id, $subject_id, $ia_number, $marks_obtained, $marks_obtained);
    }

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Marks updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error updating marks: ' . $conn->error
        ]);
    }

    $stmt->close();
    $conn->close();
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>