<?php
    session_start();
    error_reporting(E_ALL);

    // Include database constants
    if (isset($admin) && $admin) {
        include_once "../../inc/db_constants.php";
    } else {
        include_once "../inc/db_constants.php";
    }
?>