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
        case "confirmSubmission":
            // Include relevant files
            // Decode the data
            $request_data = json_decode($_POST["data"], $assoc=TRUE);
            // Check the data decoded correctly
            if (sizeof($request_data) === 0) {
                $response["error_message"] = "Malformed Data";
                $response["error_code"] = 1;
                break;
            }
            // Check that the ID provided was created by the SESSION
            if (!in_array($request_data["confirm_id"], $_SESSION["pattern_ids"])) {
                $response["error_message"] = "Pattern ID not created by user";
                $response["error_code"] = 2;
                break;
            }
            // Confirm the provided point pattern
            $confirmation_sql = "UPDATE `point_patterns` SET `Confirmed`=1 WHERE `ID`=:id";
            $confirmation_sql_variables = array(":id" => $request_data["confirm_id"]);
            try {
                DB::query($confirmation_sql, $confirmation_sql_variables);
            } catch (PDOException $e) {
                $response["error_message"] = "Server error";
                $response["error_code"] = 0;
                break;
            }
            // Delete other point patterns
            $cleanup_sql = "DELETE FROM `point_patterns` WHERE (`Confirmed`=0) AND (`ID`=:id0";
            $cleanup_sql_variables = array(":id0" => $_SESSION["pattern_ids"][0]);
            for ($i = 1; $i < sizeof($_SESSION["pattern_ids"]); $i++) {
                $cleanup_sql .= " OR `ID`=:id".$i;
                $cleanup_sql_variables[":id".$i] = $_SESSION["pattern_ids"][$i];
            }
            $cleanup_sql .= ")";
            try {
                DB::query($cleanup_sql, $cleanup_sql_variables);
            } catch (PDOException $e) {
                $response["error_message"] = "Server error";
                $response["error_code"] = 0;
                break;
            }
            // Reset tracked point patterns
            $_SESSION["pattern_ids"] = array();
            $response["status"] = "success";
            break;
        case "submitPoints":
            // Include relevant files
            include_once "../inc/enums/Shapes.php";
            include_once "../inc/enums/RestrictionTypes.php";
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
            if (sizeof($request_data["point_pattern"]["x"]) < $_SESSION["minimum_number"]) {
                $response["error_message"] = "Too few points";
                $response["error_code"] = 3;
                break;
            }
            if (sizeof($request_data["point_pattern"]["x"]) > $_SESSION["maximum_number"]) {
                $response["error_message"] = "Too many points";
                $response["error_code"] = 4;
                break;
            }
            if (sizeof($request_data["point_pattern"]["x"]) !== sizeof($request_data["point_pattern"]["y"])) {
                $response["error_message"] = "Difference in number of points for each coordinate axis";
                $response["error_code"] = 5;
                break;
            }
            // Validate all restrictions
            foreach (RestrictionTypes::ALL() as $restriction) {
                if ($request_data["limitations"][$restriction->getFunctionalName()] !== $_SESSION[$restriction->getFunctionalName()]) {
                    $response["error_message"] = "Mismatch in restrictions expected and those provided by user";
                    $response["error_code"] = 6;
                    echo json_encode($response);
                    exit;
                }
            }
            // Insert into database
            // Form limitations insert
            $limitations_sql = "INSERT INTO `Limitations` (`Minimum_radius`, `Maximum_radius`, `Minimum_number`, `Maximum_number`) VALUES (:min_rad, :max_rad, :min_num, :max_num)";
            $limitations_sql_param = array(":min_rad" => $request_data["limitations"]["minimum_radius"], ":max_rad" => $request_data["limitations"]["maximum_radius"], ":min_num" => $request_data["limitations"]["minimum_number"], ":max_num" => $request_data["limitations"]["maximum_number"]);
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
            if (!isset($_SESSION["pattern_ids"])) {
                $_SESSION["pattern_ids"] = array($insert_id);
            } else {
                array_push($_SESSION["pattern_ids"], $insert_id);
            }
            $response["status"] = "success";
            $response["insert_id"] = $insert_id;
            break;
        default:
            $response["error_message"] = "Failed to provide valid process";
    }
    $response["process"] = $_POST["process"];
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
                6 - There was a mismatch in the restrictions provided from the user and those expected by the server
*/
?>