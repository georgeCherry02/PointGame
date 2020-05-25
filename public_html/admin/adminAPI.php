<?php
    $admin = TRUE;
    include_once "../../inc/base.php";
    include_once "../../inc/admin_constants.php";
    include_once "../../inc/classes/Admin.php";
    // Declare response
    $response = array();
    $response["status"] = "failure";
    // Check this is a valid Admin session
    if (!Admin::isLoggedIn()) {
        $response["error_message"] = "Invalid Admin Session";
        echo json_encode($response);
        exit;
    }
    // Check for valid AJAX token
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
    // Check if additional data header has been provided
    if (!isset($_POST["data"])) {
        $response["error_message"] = "Failed to provide valid data";
        echo json_encode($response);
        exit;
    }


    // Determine process and act on it
    switch ($_POST["process"]) {
        default:
            // No further code so no need to exit
            $response["error_message"] = "Failed ot provide valid process";
    }
    echo json_encode($response);
?>