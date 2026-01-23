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
    $status = $_POST['status'] ?? '';
    $date = $_POST['date'] ?? date('Y-m-d'); // Use provided date or default to today

    // Validate input
    if ($subject_id <= 0 || !in_array($status, ['present', 'absent'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid input'
        ]);
        exit;
    }

    $conn = getDBConnection();

    // Insert attendance record with the specified date
    $sql = "INSERT INTO attendance (student_id, subject_id, status, date) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iiss", $student_id, $subject_id, $status, $date);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Attendance updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error updating attendance: ' . $conn->error
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