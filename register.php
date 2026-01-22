<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usn = trim($_POST['usn'] ?? '');
    $password = $_POST['password'] ?? '';
    $name = trim($_POST['name'] ?? '');
    $semester = intval($_POST['semester'] ?? 6);
    $college = trim($_POST['college'] ?? 'MVJ College of Engineering');
    $openElective = trim($_POST['openElective'] ?? '');
    $openElectiveCode = trim($_POST['openElectiveCode'] ?? '');
    $aecVertical = trim($_POST['aecVertical'] ?? '');
    $aecVerticalCode = trim($_POST['aecVerticalCode'] ?? '');

    // Validate required fields
    if (
        empty($usn) || empty($password) || empty($name) || empty($openElective) ||
        empty($openElectiveCode) || empty($aecVertical) || empty($aecVerticalCode)
    ) {
        echo json_encode([
            'success' => false,
            'message' => 'All fields are required'
        ]);
        exit;
    }

    // Validate password length
    if (strlen($password) < 4) {
        echo json_encode([
            'success' => false,
            'message' => 'Password must be at least 4 characters long'
        ]);
        exit;
    }

    $conn = getDBConnection();

    // Check if USN already exists
    $checkStmt = $conn->prepare("SELECT id FROM students WHERE usn = ? OR username = ?");
    $checkStmt->bind_param("ss", $usn, $usn);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'USN already registered. Please login instead.'
        ]);
        $checkStmt->close();
        $conn->close();
        exit;
    }
    $checkStmt->close();

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Begin transaction
    $conn->begin_transaction();

    try {
        // Insert student
        $stmt = $conn->prepare("INSERT INTO students (usn, username, password, name, semester, college) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssis", $usn, $usn, $hashedPassword, $name, $semester, $college);
        $stmt->execute();
        $student_id = $conn->insert_id;
        $stmt->close();

        // Insert default subjects (common for all students)
        $defaultSubjects = [
            ['Cloud Computing & Full Stack Application Development', 'MVJ22CS61'],
            ['Cloud Computing Lab', 'MVJ22CS61'],
            ['Machine Learning', 'MVJ22CS62'],
            ['Machine Learning Lab', 'MVJ22CSL66'],
            ['Major Project Phase - I', 'MVJ22CSP65'],
            ['Blockchain Technology', 'MVJ22CS631'],
            ['Indian Knowledge System', 'MVJ22IKK68'],
            // Next will be Open Elective (user-specific) - replaces Airline & Airport Management System
            // Last will be AEC Vertical (user-specific)
        ];

        $subjectStmt = $conn->prepare("INSERT INTO subjects (student_id, name, code) VALUES (?, ?, ?)");

        // Insert default subjects
        foreach ($defaultSubjects as $subject) {
            $subjectStmt->bind_param("iss", $student_id, $subject[0], $subject[1]);
            $subjectStmt->execute();
        }

        // Insert Open Elective (replaces Airline & Airport Management System)
        $subjectStmt->bind_param("iss", $student_id, $openElective, $openElectiveCode);
        $subjectStmt->execute();

        // Insert AEC Vertical
        $subjectStmt->bind_param("iss", $student_id, $aecVertical, $aecVerticalCode);
        $subjectStmt->execute();

        $subjectStmt->close();

        // Commit transaction
        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Registration successful! Redirecting to login...'
        ]);

    } catch (Exception $e) {
        // Rollback on error
        $conn->rollback();
        echo json_encode([
            'success' => false,
            'message' => 'Registration failed: ' . $e->getMessage()
        ]);
    }

    $conn->close();

} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>