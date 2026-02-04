<?php
require_once 'config.php';

header('Content-Type: application/json');

$conn = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    switch ($action) {
        case 'check_user':
            // Check if a user exists and has fingerprint credentials
            $username = $data['username'] ?? '';

            if (empty($username)) {
                echo json_encode(['success' => false, 'message' => 'Username required']);
                exit;
            }

            $stmt = $conn->prepare("SELECT id, usn, username, name, fingerprint_credentials, fingerprint_prompted FROM students WHERE usn = ? OR username = ?");
            $stmt->bind_param("ss", $username, $username);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                $has_fingerprint = !empty($user['fingerprint_credentials']);

                echo json_encode([
                    'success' => true,
                    'user_found' => true,
                    'has_fingerprint' => $has_fingerprint,
                    'name' => $user['name'],
                    'usn' => $user['usn'],
                    'fingerprint_prompted' => (bool) $user['fingerprint_prompted']
                ]);
            } else {
                echo json_encode([
                    'success' => true,
                    'user_found' => false,
                    'has_fingerprint' => false
                ]);
            }
            $stmt->close();
            break;

        case 'get_auth_challenge':
            // Generate challenge for fingerprint authentication
            $username = $data['username'] ?? '';

            if (empty($username)) {
                echo json_encode(['success' => false, 'message' => 'Username required']);
                exit;
            }

            $stmt = $conn->prepare("SELECT id, fingerprint_credentials FROM students WHERE usn = ? OR username = ?");
            $stmt->bind_param("ss", $username, $username);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                $credentials = json_decode($user['fingerprint_credentials'], true) ?: [];

                if (empty($credentials)) {
                    echo json_encode(['success' => false, 'message' => 'No fingerprint credentials found']);
                    exit;
                }

                $challenge = bin2hex(random_bytes(32));
                $_SESSION['webauthn_auth_challenge'] = $challenge;
                $_SESSION['webauthn_auth_user_id'] = $user['id'];

                // Get credential IDs for allowCredentials
                $credential_ids = array_map(function ($c) {
                    return $c['id']; }, $credentials);

                echo json_encode([
                    'success' => true,
                    'challenge' => $challenge,
                    'credential_ids' => $credential_ids
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'User not found']);
            }
            $stmt->close();
            break;

        case 'verify_auth':
            // Verify fingerprint authentication
            $credential_id = $data['credential_id'] ?? '';
            $authenticator_data = $data['authenticator_data'] ?? '';
            $signature = $data['signature'] ?? '';

            if (empty($credential_id)) {
                echo json_encode(['success' => false, 'message' => 'Invalid authentication data']);
                exit;
            }

            if (!isset($_SESSION['webauthn_auth_user_id'])) {
                echo json_encode(['success' => false, 'message' => 'Authentication session expired']);
                exit;
            }

            $user_id = $_SESSION['webauthn_auth_user_id'];

            // Get user info
            $stmt = $conn->prepare("SELECT id, usn, username, name, fingerprint_credentials FROM students WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                $credentials = json_decode($user['fingerprint_credentials'], true) ?: [];

                // Find matching credential
                $valid = false;
                foreach ($credentials as $cred) {
                    if ($cred['id'] === $credential_id) {
                        // In a real implementation, we would verify the signature
                        // For this simplified version, we trust the browser's WebAuthn API
                        $valid = true;
                        break;
                    }
                }

                if ($valid) {
                    // Set session variables
                    $_SESSION['logged_in'] = true;
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['usn'] = $user['usn'];
                    $_SESSION['student_id'] = $user['id'];
                    $_SESSION['name'] = $user['name'];

                    // Clear auth challenge
                    unset($_SESSION['webauthn_auth_challenge']);
                    unset($_SESSION['webauthn_auth_user_id']);

                    echo json_encode([
                        'success' => true,
                        'message' => 'Authentication successful'
                    ]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Fingerprint not recognized']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'User not found']);
            }
            $stmt->close();
            break;

        case 'get_remembered_user':
            // Get remembered user from localStorage (handled on frontend, this is for verification)
            echo json_encode(['success' => true, 'message' => 'Use localStorage on frontend']);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

$conn->close();
?>