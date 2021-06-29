<?php
    class Review {
        private static $_pattern_to_be_reviewed_amount = 3;
        private static $_valid_review_amount = 10;
        private static $_total_pattern_amount = 30;
        public static function fetchReviewablePatterns() {
            // Fetch a subset of patterns that are not fully reviewed yet and are complete
            $fetch_sql = "SELECT `ID`, `Shape_Name`, `Point_Pattern`, `Canvas_Size`, `Freeplay`, `Restriction_Summary`, `Nickname` FROM `Point_Patterns` LIMIT ".self::$_total_pattern_amount;
            $fetch_sql_variables = array(":rev_amount" => self::$_valid_review_amount);
            try {
                $reviewable_patterns = DB::query($fetch_sql, $fetch_sql_variables);
            } catch (PDOException $e) {
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to fetch patterns for review"));
                return false;
            }
            // Determine pattern ids being reviewed
            $pattern_indices = array();
            while (sizeof($pattern_indices) < self::$_pattern_to_be_reviewed_amount && sizeof($pattern_indices) < sizeof($reviewable_patterns) /* This fail safe's required incase there aren't that many patterns to be reviewed */) {
                $random_index = rand(0, sizeof($reviewable_patterns) - 1);
                if (!in_array($random_index, $pattern_indices)) {
                    array_push($pattern_indices, $random_index);
                }
            }
            // Push these patterns into an array
            $patterns_to_be_reviewed = array();
            for ($i = 0; $i < sizeof($pattern_indices); $i++) {
                $c_pattern = $reviewable_patterns[$pattern_indices[$i]];
                array_push($patterns_to_be_reviewed, $c_pattern);
            }
            // Return said array
            return $patterns_to_be_reviewed;
        }
        public static function transformPatternData($pattern) {
            $result = ["x" => [], "y" => [], "c" => []];
            foreach ($pattern as $colour => $coord_info) {
                for ($i = 0; $i < count($coord_info["x"]); $i++) {
                    array_push($result["c"], $colour);
                    array_push($result["x"], $coord_info["x"][$i]);
                    array_push($result["y"], $coord_info["y"][$i]);
                }
            }
            return $result;
        }
        public static function removeInvalidPattern($pattern_id) {
            Logger::log(LoggingType::ERROR(), array("Attempting to delete an invalid shape", "ID: ".$pattern_id));
            // Double check it's invalid
            $invalidity_check_sql = "SELECT `Shape_Name`, `Restriction_Summary` FROM `Point_Patterns` WHERE `ID`=:id";
            $invalidity_check_variables = array(":id" => $pattern_id);
            try {
                $invalid_pattern_info = DB::query($invalidity_check_sql, $invalidity_check_variables)[0];
            } catch (PDOException $e) {
                Logger::log(LoggingType::ERROR(), array("PDOException", "Failed to fetch the invalid point pattern's data"));
                return false;
            }
            // Declare variables representing whether the pattern should be deleted
            $invalid = false;
            // Check shape pattern
            try {
                $shape = Shapes::fromName($invalid_pattern_info)["Shape_Name"];
            } catch (OutOfRangeException $e) {
                $invalid = true;
            }
            // Remove the invalid shape
            if ($invalid) {
                $delete_pattern_sql = "DELETE FROM `Point_Patterns` WHERE `ID`=:id";
                $delete_pattern_variables = array(":id" => $pattern_id);
                try {
                    DB::query($delete_pattern_sql, $delete_pattern_variables);
                } catch (PDOException $e) {
                    Logger::log(LoggingType::ERROR(), array("PDOException", "Failed to delete invalid point pattern", "ID: ".$pattern_id));
                    return false;
                }
            }
            Logger::log(LoggingType::STATUS(), array("Removed invalid point pattern", "ID: ".$pattern_id));
        }
        public static function updateAuthPatternReviews($reviews) {
            // Fetch initial reviews scores and number of reviews for patterns being reviewed
            $fetch_initial_review_sql = "SELECT `ID`, `Auth_Review_Scores`, `Auth_Review_Amount`, `Auth_Review_Average` FROM `Point_Patterns` WHERE `ID`=:id_1 OR `ID`=:id_2 OR `ID`=:id_3";
            $fetch_initial_review_sql_variables = array();
            $i = 1;
            foreach ($reviews as $review_id => $review_score) {
                $fetch_initial_review_sql_variables[":id_".$i] = $review_id;
                $i++;
            }
            try {
                $initial_review_info = DB::query($fetch_initial_review_sql, $fetch_initial_review_sql_variables);
            } catch (PDOException $e) {
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to fetch initial review info when updating it", "ID: ".$review_id));
                return FALSE;
            }
            // Calculate new scores and amounts for each review and then update database
            for ($i = 0; $i < sizeof($initial_review_info); $i++) {
                // Fetch current point pattern
                $cpp = $initial_review_info[$i];
                $score = intval($reviews[$cpp["ID"]]);
                // Decode initial score array
                $init_scores = json_decode($cpp["Auth_Review_Scores"]);
                $init_amount = intval($cpp["Auth_Review_Amount"]);
                $init_average = intval($cpp["Auth_Review_Average"]);
                $fin_amount = $init_amount + 1;
                $fin_average = ($init_average * $init_amount + $score) / $fin_amount;
                // Push new score to array
                array_push($init_scores, $score);
                $fin_scores = json_encode($init_scores);
                // Update the database with this information
                $update_review_sql = "UPDATE `Point_Patterns` SET `Auth_Review_Scores`=:rev_scores, `Auth_Review_Amount`=:auth_amount, `Auth_Review_Average`=:auth_avg WHERE `ID`=:id";
                $update_review_variables = array(":id" => $cpp["ID"], ":rev_scores" => $fin_scores, ":auth_amount" => $fin_amount, ":auth_avg" => $fin_average);
                try {
                    DB::query($update_review_sql, $update_review_variables);
                } catch (PDOException $e) {
                    Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to update review info of point pattern", "ID: ".$review_id));
                    return FALSE;
                }
            }
            return TRUE;
        }
    }
?>