<?php
    session_start();
    error_reporting(E_ALL);

    // Include database constants
    if ($admin) {
        include_once "../../inc/db_constants.php";
    } else {
        include_once "../inc/db_constants.php";
    }
?>