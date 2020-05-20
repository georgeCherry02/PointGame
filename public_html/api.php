<?php
    // Include base
    include_once "../inc/base.php";
    include_once "../inc/classes/Database.php";
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
            if (sizeof($request_data["point_pattern"]["x"]) < $_SESSION["min_points_number"]) {
                $response["error_message"] = "Too few points";
                $response["error_code"] = 3;
                break;
            }
            if (sizeof($request_data["point_pattern"]["x"]) > $_SESSION["max_points_number"]) {
                $response["error_message"] = "Too many points";
                $response["error_code"] = 4;
                break;
            }
            if (sizeof($request_data["point_pattern"]["x"]) !== sizeof($request_data["point_patter"]["y"])) {
                $response["error_message"] = "Difference in number of points for each coordinate axis";
                $response["error_code"] = 5;
                break;
            }
            // Insert into database
            // Form limitations insert
            $limitations_sql = "INSERT INTO `Limitations` (`Minimum_radius`, `Maximum_radius`, `Minimum_number`, `Maximum_number`) VALUES (:min_rad, :max_rad, :min_num, :max_num)";
            $limitations_sql_param = array(":min_rad" => $request_data["limitations"]["min_radius"], ":max_rad" => $request_data["limitations"]["max_radius"], ":min_num" => $_SESSION["min_points_number"], ":max_num" => $_SESSION["max_points_number"]);
            try {
                $limitation_id = DB::query($limitations_sql, $limitations_sql_param);
            } catch (PDOException $e) {
                $response["error_message"] = "Server Error";
                $response["error_code"] = 0;
                break;
            }
            if ($limitation_id) {
                $point_pattern_sql = "INSERT INTO `point_patterns` (`Shape_ID`, `Limitations_ID`, `Point_Pattern`) VALUES (:shape_id, :lim_id, :pp)";
                $point_pattern_sql_param = array(":shape_id" => $request_data["expected_shape"], ":lim_id" => $limitation_id, ":pp" => json_encode($request_data["point_pattern"]));
                try {
                    $insert_id = DB::query($point_pattern_sql, $point_pattern_sql_param);
                } catch (PDOException $e) {
                    $response["error_message"] = "Server Error";
                    $response["error_code"] = 0;
                }
            } else {
                $response["error_message"] = "Server Error";
                $response["error_code"] = 0;
                break;
            }
            $response["status"] = "success";
            $response["insert_id"] = $insert_id;
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
                0 - Server error occured when interacting with database
                1 - Data wasn't in valid JSON format    
                2 - The shape tag received didn't match the expected tag
                3 - There were too few points submitted
                4 - There were too many points submitted
                5 - There was a mismatch in the number of points submitted
*/
?>