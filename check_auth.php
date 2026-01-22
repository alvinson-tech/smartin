<?php
require_once 'config.php';

header('Content-Type: application/json');

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    echo json_encode([
        'authenticated' => true,
        'username' => $_SESSION['username']
    ]);
} else {
    echo json_encode([
        'authenticated' => false
    ]);
}
?>