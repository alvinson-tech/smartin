<?php
require_once 'config.php';

// Destroy session
session_destroy();

header('Content-Type: application/json');
echo json_encode(['success' => true]);
?>