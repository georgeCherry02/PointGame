<?php
    session_start();
    error_reporting(E_ALL);

    // Include database constants
    $relative_home_root = "../";
    if (isset($admin) && $admin) {
        $relative_home_root = "../../";
    }
    include_once $relative_home_root."inc/db_constants.php";
    include_once $relative_home_root."inc/Enum.php";
    include_once $relative_home_root."inc/classes/Logger.php";
?>