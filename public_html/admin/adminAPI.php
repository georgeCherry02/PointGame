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

    // Include classes common to each process
    $inc_root = "../../inc/";
    include_once $inc_root."db_constants.php";
    include_once $inc_root."classes/Database.php";
    include_once $inc_root."classes/Restrictions.php";

    // Attempt to read in data
    $request_data = json_decode($_POST["data"], $assoc=TRUE);
    // Check for data corruption
    if (sizeof($request_data) === 0) {
        $response["error_message"] = "Malformed data";
        echo json_encode($response);
        exit;
    }

    // Determine process and act on it
    switch ($_POST["process"]) {
        case "removeRestrictionSet":
            // Check that an integer was actually passed
            if (filter_var($request_data["remove_id"], FILTER_VALIDATE_INT)) {
                $outcome = Restrictions::removeSet($request_data["remove_id"]);
            } else {
                $response["error_message"] = "Invalid ID supplied";
                $response["error_code"] = 1;
                break;
            }
            // Determine the outcome of removal
            switch ($outcome) {
                case 0:
                    $response["status"] = "success";
                    break;
                case 2:
                    $response["error_message"] = "You can't delete the last restriction set you have!";
                    $response["error_code"] = 3;
                    break;
                case 1:
                default:
                    $response["error_message"] = "Server error";
                    $response["error_code"] = 2;
            }
            break;
        case "setRestrictionSetActive":
            if (filter_var($request_data["active_id"], FILTER_VALIDATE_INT)) {
                $outcome = Restrictions::setActive($request_data["active_id"]);
            } else {
                $response["error_message"] = "Invalid ID supplied";
                $response["error_code"] = 1;
            }
            if ($outcome) {
                $response["status"] = "success";
                $response["id"] = $request_data["active_id"];
                break;
            } else {
                $response["error_message"] = "Server error";
                $response["error_code"] = 2;
            }
            break;
        default:
            // No further code so no need to exit
            $response["error_message"] = "Failed to provide valid process";
    }
    echo json_encode($response);
?>