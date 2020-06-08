<?php
    class Review {
        private static $_pattern_to_be_reviewed_amount = 3;
        private static $_valid_review_amount = 10;
        private static $_total_pattern_amount = 30;
        public static function fetchReviewablePatterns() {
            // Fetch a subset of patterns that are not fully reviewed yet and are complete
            $fetch_sql = "SELECT `ID`, `Shape_ID`, `Limitations_ID`, `Point_Pattern` FROM `Point_Patterns` WHERE `Confirmed`=1 AND `Review_Amount` < :rev_amount LIMIT ".self::$_total_pattern_amount;
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
        public static function updatePatternReviews($reviews) {
            // Fetch initial reviews scores and number of reviews for patterns being reviewed
            $fetch_initial_review_sql = "SELECT `ID`, `Review_Score`, `Review_Amount` FROM `Point_Patterns` WHERE `ID`=:id_1 OR `ID`=:id_2 OR `ID`=:id_3";
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
                // Initialise final summary object for cpp
                // Fetch initial information
                $init_score = $cpp["Review_Score"];
                $init_amount = $cpp["Review_Amount"];
                // Determine final properties
                $final_amount = $init_amount + 1;
                $final_score = floor((($init_score * $init_amount) + $reviews[$cpp["ID"]]) / ($final_amount));
                // Update the database with this information
                $update_review_sql = "UPDATE `Point_Patterns` SET `Review_Score`=:rev_score, `Review_Amount`=:rev_amount WHERE `ID`=:id";
                $update_review_variables = array(":rev_score" => $final_score, ":rev_amount" => $final_amount, ":id" => $cpp["ID"]);
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