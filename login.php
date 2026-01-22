<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    $conn = getDBConnection();

    // Try to find user in database
    $stmt = $conn->prepare("SELECT id, usn, username, password, name FROM students WHERE usn = ? OR username = ?");
    $stmt->bind_param("ss", $username, $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        // Check if password is hashed or plain text (for backward compatibility)
        $passwordValid = false;

        if (password_get_info($user['password'])['algo'] !== null) {
            // Password is hashed, verify using password_verify
            $passwordValid = password_verify($password, $user['password']);
        } else {
            // Plain text password (old system), direct comparison
            $passwordValid = ($password === $user['password']);
        }

        if ($passwordValid) {
            $_SESSION['logged_in'] = true;
            $_SESSION['username'] = $user['username'];
            $_SESSION['usn'] = $user['usn'];
            $_SESSION['student_id'] = $user['id'];
            $_SESSION['name'] = $user['name'];

            echo json_encode([
                'success' => true,
                'message' => 'Login successful'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid username or password'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
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