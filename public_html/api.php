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
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to confirm point pattern", "ID: ".$request_data["confirm_id"]));
                $response["error_message"] = "Server Error";
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
                Logger::log(LoggingType::ERROR(), array("PDOException", "Failed to delete unconfirmed patterns", "IDs: ".json_encode($_SESSION["pattern_ids"])));
                // ##########################################################################################
                // # Not sure whether to keep this in... will decide once hosting's sorted
                // ##########################################################################################
                error_log("Failed to delete unconfirmed patterns, needs to be resolved", 1, ADMIN_EMAIL);
                $response["error_message"] = "Server Error";
                $response["error_code"] = 0;
                break;
            }
            // Reset tracked point patterns
            $_SESSION["pattern_ids"] = array();
            $_SESSION["review_mode"] = TRUE;
            Logger::log(LoggingType::NOTICE(), array("New point pattern submitted", "ID: ".$request_data["confirm_id"]));
            $response["status"] = "success";
            break;
        case "fetchReviewPatterns":
            // No data required
            include_once "../inc/classes/Review.php";
            include_once "../inc/enums/Shapes.php";
            // Fetch the patterns for review
            $review_patterns = Review::fetchReviewablePatterns();
            if (!$review_patterns) {
                $response["error_message"] = "Server Error";
                $response["error_code"] = 0;
                break;
            }
            // Check enough patterns were submitted
            if (sizeof($review_patterns) < 3) {
                $response["less_than_expected"] = 1;
                $response["amount_received"] = sizeof($review_patterns);
            } else {
                $response["less_than_expected"] = 0;
            }
            $_SESSION["reviewed_pattern_ids"] = array();
            $invalid_shape_provided = FALSE;
            $invalid_shape_id;
            $server_error = FALSE;
            for ($i = 1; $i <= sizeof($review_patterns); $i++) {
                $current_pattern = $review_patterns[$i-1];
                $current_pattern_data = json_decode($current_pattern["Point_Pattern"], $assoc=TRUE);
                $rspns_key = "point_pattern_".$i;
                $response[$rspns_key] = array();
                // Fetch basic pattern data
                $response[$rspns_key]["x"] = $current_pattern_data["x"];
                $response[$rspns_key]["y"] = $current_pattern_data["y"];
                // Fetch pattern ID
                $response[$rspns_key]["ID"] = $current_pattern["ID"];
                // Track pattern IDs being reviewed
                array_push($_SESSION["reviewed_pattern_ids"], $current_pattern["ID"]);
                // Fetch pattern shape
                try {
                    $shape_id = intval($current_pattern["Shape_ID"]);
                    $point_pattern_shape = Shapes::fromID($shape_id);
                    $response[$rspns_key]["Shape_Name"] = $point_pattern_shape->getRenderedName();
                } catch (OutOfRangeException $e) {
                    // Logging handled inside Review::removeInvalidPattern logging
                    $invalid_shape_provided = TRUE;
                    $invalid_shape_id = $current_pattern["ID"];
                    break;
                }
                // Fetch pattern min_radius
                $limitations_id = $current_pattern["Limitations_ID"];
                $fetch_min_radius_sql = "SELECT `Minimum_Radius` FROM `Limitations` WHERE `ID`=:lim_id";
                $fetch_min_radius_sql_variables = array(":lim_id" => $limitations_id);
                try {
                    $min_radius = DB::query($fetch_min_radius_sql, $fetch_min_radius_sql_variables)[0]["Minimum_Radius"];
                } catch (PDOException $e) {
                    $server_error = TRUE;
                    break;
                }
                if (!$min_radius) {
                    $server_error = TRUE;
                    break;
                }
                $response[$rspns_key]["Minimum_Radius"] = $min_radius;
            }
            // Catch if an invalid shape has been thrown
            if ($invalid_shape_provided) {
                // Remove invalid shape
                Review::removeInvalidPattern($invalid_shape_id);
                // Send response that signifies the page should be reloaded
                $response["error_message"] = "Invalid Shape ID Stored";
                $response["error_code"] = 1;
                break;
            }
            if ($server_error) {
                Logger::log(LoggingType::WARNING(), array("Failed to fetch minimum radius for pattern on review page"));
                $response["error_message"] = "Server Error";
                $response["error_code"] = 0;
                break;
            }
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
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to insert restriction information when attempting to insert new point pattern"));
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
                    // Remove restriction set if the final insert fails
                    Logger::log(LoggingType::ERROR(), array("PDOException", "Failed to insert new point pattern", "Attempting to remove limitation information from database", "Limitation ID: ".$limitation_id));
                    $remove_restriction_sql = "DELETE FROM `Limitations` WHERE `ID`=:id";
                    $remove_restriction_variables = array(":id" => $limitation_id);
                    try {
                        DB::query($remove_restriction_sql, $remove_restriction_variables);
                    } catch (PDOException $e) {
                        Logger::log(LoggingType::ERROR(), array("PDOException", "Failed to remove limitations after failed point pattern insert", "Limitation ID: ".$limitation_id));
                        // ##########################################################################################
                        // # Not sure whether to keep this in... will decide once hosting's sorted
                        // ##########################################################################################
                        error_log("Failed to delete limitation of failed pattern insert, needs to be resolved, limitation id: ".$limitation_id, 1, ADMIN_EMAIL);
                    }
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
        case "submitReviews":
            // Include relevant files
            include_once "../inc/classes/Review.php";
            // Decode the data
            $request_data = json_decode($_POST["data"], $assoc=TRUE);
            // Assert that the data decoded correctly
            if (sizeof($request_data) === 0) {
                $response["error_message"] = "Malformed Data";
                $response["error_code"] = 1;
                break;
            }
            // Verify the review IDs and scores submitted are valid and expected
            $invalid_review_id = FALSE;
            $invalid_review_score = FALSE;
            foreach ($request_data["reviews"] as $review_id => $review_score) {
                if (!in_array($review_id, $_SESSION["reviewed_pattern_ids"])) {
                    $invalid_review_id = TRUE;
                    break;
                }
                if ($review_score < 0 || $review_score > 100) {
                    $invalid_review_score = TRUE;
                    break;
                }
            }
            if ($invalid_review_id) {
                $response["error_message"] = "Invalid Review IDs";
                $response["error_code"] = 2;
                break;
            }
            if ($invalid_review_score) {
                $response["error_message"] = "Invalid Review Score submitted";
                $response["error_code"] = 3;
                break;
            }
            // Update the current review scores
            $outcome = Review::updatePatternReviews($request_data["reviews"]);
            if (!$outcome) {
                $response["error_message"] = "Server Error";
                $response["error_code"] = 0;
                break;
            }
            $_SESSION["reviewed_pattern_ids"] = array();
            $_SESSION["review_mode"] = FALSE;
            $response["status"] = "success";
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