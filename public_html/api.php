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
                // Exit review mode for javascript refresh
                $_SESSION["review_mode"] = FALSE;
                $response["status"] = "success";
                break;
            } else {
                $response["less_than_expected"] = 0;
            }
            $_SESSION["reviewed_pattern_ids"] = array();
            for ($i = 1; $i <= sizeof($review_patterns); $i++) {
                $current_pattern = $review_patterns[$i-1];
                $current_pattern_data = json_decode($current_pattern["Point_Pattern"], $assoc=TRUE);
                if ($current_pattern["Freeplay"]) {
                    $current_pattern_data = Review::transformPatternData($current_pattern_data);
                }
                $rspns_key = "point_pattern_".$i;
                $response[$rspns_key] = array();
                // Fetch basic pattern data
                $response[$rspns_key]["x"] = $current_pattern_data["x"];
                $response[$rspns_key]["y"] = $current_pattern_data["y"];
                $response[$rspns_key]["c"] = $current_pattern_data["c"];
                // Fetch pattern ID
                $response[$rspns_key]["ID"] = $current_pattern["ID"];
                $response[$rspns_key]["canvas_size"] = $current_pattern["Canvas_Size"];
                $response[$rspns_key]["freeplay"] = $current_pattern["Freeplay"];
                $response[$rspns_key]["nickname"] = $current_pattern["Nickname"];
                $response[$rspns_key]["title"] = $current_pattern["Shape_Name"];
                // Track pattern IDs being reviewed
                array_push($_SESSION["reviewed_pattern_ids"], $current_pattern["ID"]);
                // Fetch pattern shape
                // Fetch pattern min_radius
                $current_restrictions = json_decode($current_pattern["Restriction_Summary"], $assoc=TRUE);
                $response[$rspns_key]["Minimum_Radius"] = $current_restrictions["minimum_radius"];
            }
            $response["status"] = "success";
            break;
        case "fetchShape":
            include_once "../inc/enums/Shapes.php";
            $shapes = Shapes::ALL();
            $shape_amount = count(Shapes::ALL());
            $index = rand(0, $shape_amount-1);
            $response["shape"] = $shapes[$index]->getName();
            $response["status"] = "success";
            break;
        case "submitPoints":
            // Include relevant files
            include_once "../inc/enums/Shapes.php";
            include_once "../inc/classes/Restrictions.php";
            include_once "../inc/enums/CheckTypes.php";
            include_once "../inc/enums/RestrictionTypes.php";
            // Decode the data
            $request_data = json_decode($_POST["data"], $assoc=TRUE);
            // Check the data decoded correctly
            if (sizeof($request_data) === 0) {
                $response["error_message"] = "Malformed Data";
                $response["error_code"] = 1;
                break;
            }
            $free = $request_data["freeplay"];
            // Check the shape matches the expected shape
            if (!$free && $request_data["restrictions"]["chosen_shape"] != $_SESSION["Restrictions"]["shape_name"]) {
                $response["error_message"] = "Mismatching shape received";
                $response["error_code"] = 2;
                break;
            }
            // Check their are the correct number of points
            if (!$free && sizeof($request_data["point_pattern"]["x"]) < $_SESSION["Restrictions"]["minimum_number"]) {
                $response["error_message"] = "Too few points";
                $response["error_code"] = 3;
                break;
            }
            if (!$free && sizeof($request_data["point_pattern"]["x"]) > $_SESSION["Restrictions"]["maximum_number"]) {
                $response["error_message"] = "Too many points";
                $response["error_code"] = 4;
                break;
            }
            if (!$free && sizeof($request_data["point_pattern"]["x"]) !== sizeof($request_data["point_pattern"]["y"])) {
                $response["error_message"] = "Difference in number of points for each coordinate axis";
                $response["error_code"] = 5;
                break;
            }
            // Validate restrictions
            $restrictions_valid = TRUE;
            if (!$free) {
                $restrictions_valid = Restrictions::validateRestrictionSet($request_data["restrictions"]);
            }
            if (!$restrictions_valid) {
                $response["error_message"] = "Invalid restrictions sent by Client";
                $response["error_code"] = 6;
                break;
            }
            $point_pattern_sql = "INSERT INTO `Point_Patterns` (`Shape_Name`, `Point_Pattern`, `Canvas_Size`, `Restriction_Summary`, `Submission_Date`, `Nickname`) VALUES (:shape, :pp, :canvas_size, :res_sum, '".date("yy/m/d")."', :nn)";
            $point_pattern_sql_param = array(":shape" => $request_data["restrictions"]["chosen_shape"], ":pp" => json_encode($request_data["point_pattern"]), ":canvas_size" => $request_data["canvas_size"], ":res_sum" => json_encode($request_data["restrictions"]), ":nn" => $request_data["nickname"]);
            try {
                $insert_id = DB::query($point_pattern_sql, $point_pattern_sql_param);
            } catch (PDOException $e) {
                // Remove restriction set if the final insert fails
                Logger::log(LoggingType::ERROR(), array("PDOException", "Failed to insert new point pattern"));
                $response["error_message"] = "Server Error";
                $response["error_code"] = 0;
                break;
            }
            $_SESSION["review_mode"] = True;
            Logger::log(LoggingType::NOTICE(), array("New point pattern submitted", "ID: ".$insert_id));
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