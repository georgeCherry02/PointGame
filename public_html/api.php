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
        case "submitPoints":
            $response["process"] = "submitPoints";
            include_once "../inc/enums/Shapes.php";
            // Decode the data
            $request_data = json_decode($_POST["data"], $assoc=TRUE);
            // Check the data decoded correctly
            if (sizeof($request_data) === 0) {
                $response["error_message"] = "Malformed Data";
                $response["error_code"] = 1;
                break;
            }
            // Check the shape matches the expected shape
            if ($request_data["expected_shape"] != $_SESSION["Expected_Shape_ID"]) {
                $response["error_message"] = "Unexpected shape tag received";
                $response["error_code"] = 2;
                break;
            }
            // Check their are the correct number of points
            if (sizeof($request_data["point_pattern"]) < $_SESSION["min_points_number"]) {
                $response["error_message"] = "Too few points";
                $response["error_code"] = 3;
                break;
            }
            if (sizeof($request_data["point_pattern"]) > $_SESSION["max_points_number"]) {
                $response["error_message"] = "Too many points";
                $response["error_code"] = 4;
                break;
            }
            // ##########################################################################################
            // # Insert into database
            // ##########################################################################################
            $response["status"] = "success";
            break;
        default:
            $response["error_message"] = "Failed to provide valid process";
    }
    echo json_encode($response);
/*  Documentation
    Processes:
        submitPoints:
            Method:
                POST
            Expected Datatype:
                JSON
            Parameters:
                expected_shape - A valid shape ID
                limitations - A JSON object representing the limitations implemented when drawing the shape
                point_pattern - A list of all the coordinates of the points
            Description:
                This method should be used for inserting a new point pattern into the database
            Error Codes:
                1 - Data wasn't in valid JSON format    
                2 - The shape tag received didn't match the expected tag
                3 - There were too few points submitted
                4 - There were too many points submitted
*/
?>