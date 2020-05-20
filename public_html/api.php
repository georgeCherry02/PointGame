<?php
    // Include base
    include_once "../inc/base.php";
    include_once "../inc/Enum.php";
    // Begin by declaring server response
    $response = array();
    // Start by declaring response to have failed because we have a positive outlook on life
    $response["status"] = "failure";
    // First check if the set ajax token is correct
    if (!isset($_POST["ajax_token"]) || $_POST["ajax_token"] !== $_SESSION["ajax_token"]) {
        $response["error_message"] = "Failed to verify";
        echo json_encode($response);
        exit;
    }
    // Check if a process has been provided
    if (!isset($_POST["process"])) {
        $response["error_message"] = "Failed to provide process";
        echo json_encode($response);
        exit;
    }
    // Check if data has been provided
    if (!isset($_POST["data"])) {
        $response["error_message"] = "Failed to provide any valid data";
        echo json_encode($response);
        exit;
    }

    // Validate provided process
    // Error codes documented at bottom of API
    switch($_POST["process"]) {
        default:
            $response["error_message"] = "Failed to provide valid process";
    }
    echo json_encode($response);
