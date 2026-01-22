<?php

// define('DB_HOST', 'sql110.infinityfree.com');
// define('DB_USER', 'if0_40951392');
// define('DB_PASS', 'BhepsqaLxrV0Q3');
// define('DB_NAME', 'if0_40951392_smartin');

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'smartin_db');

function getDBConnection()
{
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    return $conn;
}

session_start();
?>