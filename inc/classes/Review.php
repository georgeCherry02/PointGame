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
    }
?>