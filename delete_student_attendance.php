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
    $attendance_id = $_POST['attendance_id'] ?? '';

    if (empty($attendance_id)) {
        echo json_encode([
            'success' => false,
            'message' => 'Attendance ID is required'
        ]);
        exit;
    }

    $conn = getDBConnection();

    // Delete attendance record (only if it belongs to the logged-in student)
    $stmt = $conn->prepare("DELETE FROM attendance WHERE id = ? AND student_id = ?");
    $stmt->bind_param("ii", $attendance_id, $student_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Attendance record deleted successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Attendance record not found or you do not have permission to delete it'
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