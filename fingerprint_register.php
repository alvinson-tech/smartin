<?php
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$conn = getDBConnection();
$student_id = $_SESSION['student_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    switch ($action) {
        case 'get_challenge':
            // Generate a random challenge for WebAuthn registration
            $challenge = bin2hex(random_bytes(32));
            $_SESSION['webauthn_challenge'] = $challenge;
            
            $user_id = $_SESSION['usn'];
            $user_name = $_SESSION['name'] ?? $_SESSION['username'];
            
            echo json_encode([
                'success' => true,
                'challenge' => $challenge,
                'user_id' => $user_id,
                'user_name' => $user_name
            ]);
            break;

        case 'register_credential':
            // Store the credential after successful WebAuthn registration
            $credential_id = $data['credential_id'] ?? '';
            $public_key = $data['public_key'] ?? '';
            $device_name = $data['device_name'] ?? 'Unknown Device';
            
            if (empty($credential_id) || empty($public_key)) {
                echo json_encode(['success' => false, 'message' => 'Invalid credential data']);
                exit;
            }
            
            // Get existing credentials
            $stmt = $conn->prepare("SELECT fingerprint_credentials FROM students WHERE id = ?");
            $stmt->bind_param("i", $student_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            
            $credentials = [];
            if (!empty($row['fingerprint_credentials'])) {
                $credentials = json_decode($row['fingerprint_credentials'], true) ?: [];
            }
            
            // Add new credential
            $credentials[] = [
                'id' => $credential_id,
                'public_key' => $public_key,
                'device_name' => $device_name,
                'registered_at' => date('Y-m-d H:i:s')
            ];
            
            // Update database
            $credentials_json = json_encode($credentials);
            $stmt = $conn->prepare("UPDATE students SET fingerprint_credentials = ?, fingerprint_prompted = 1 WHERE id = ?");
            $stmt->bind_param("si", $credentials_json, $student_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Fingerprint registered successfully',
                    'credential_count' => count($credentials)
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to save credential']);
            }
            $stmt->close();
            break;

        case 'get_credentials':
            // Get list of registered credentials for management
            $stmt = $conn->prepare("SELECT fingerprint_credentials FROM students WHERE id = ?");
            $stmt->bind_param("i", $student_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            
            $credentials = [];
            if (!empty($row['fingerprint_credentials'])) {
                $credentials = json_decode($row['fingerprint_credentials'], true) ?: [];
                // Remove sensitive public_key from response
                foreach ($credentials as &$cred) {
                    unset($cred['public_key']);
                }
            }
            
            echo json_encode([
                'success' => true,
                'credentials' => $credentials
            ]);
            break;

        case 'delete_credential':
            // Delete a specific credential
            $credential_id = $data['credential_id'] ?? '';
            
            if (empty($credential_id)) {
                echo json_encode(['success' => false, 'message' => 'Credential ID required']);
                exit;
            }
            
            $stmt = $conn->prepare("SELECT fingerprint_credentials FROM students WHERE id = ?");
            $stmt->bind_param("i", $student_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            
            $credentials = [];
            if (!empty($row['fingerprint_credentials'])) {
                $credentials = json_decode($row['fingerprint_credentials'], true) ?: [];
            }
            
            // Filter out the credential to delete
            $credentials = array_filter($credentials, function($cred) use ($credential_id) {
                return $cred['id'] !== $credential_id;
            });
            $credentials = array_values($credentials);
            
            // Update database
            $credentials_json = empty($credentials) ? null : json_encode($credentials);
            $stmt = $conn->prepare("UPDATE students SET fingerprint_credentials = ? WHERE id = ?");
            $stmt->bind_param("si", $credentials_json, $student_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Credential deleted successfully',
                    'credential_count' => count($credentials)
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete credential']);
            }
            $stmt->close();
            break;

        case 'dismiss_prompt':
            // Mark that user has been prompted (dismissed the popup)
            $stmt = $conn->prepare("UPDATE students SET fingerprint_prompted = 1 WHERE id = ?");
            $stmt->bind_param("i", $student_id);
            $stmt->execute();
            $stmt->close();
            
            echo json_encode(['success' => true, 'message' => 'Prompt dismissed']);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

$conn->close();
?>
