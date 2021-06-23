<?php
    $admin = TRUE;
    include_once "../../inc/base.php";
    include_once "../../inc/admin_constants.php";
    include_once "../../inc/classes/Admin.php";
    include_once "../../inc/classes/Database.php";
    if (Admin::isLoggedIn()) {
        // Determine conditions from form
        $backdate = $_POST["backdate"];
        $lowest_score = filter_input(INPUT_POST, "score", FILTER_VALIDATE_INT);
        $review_number = filter_input(INPUT_POST, "review_number", FILTER_VALIDATE_INT);
        $pattern_number = filter_input(INPUT_POST, "pattern_number", FILTER_VALIDATE_INT);
        $sql = "SELECT `Point_Pattern`, `Canvas_Size`, `Restriction_Summary` FROM `Point_Patterns` WHERE `Review_Score` > :score AND `Review_Amount` > :rev_amount AND `Submission_Date` > '".$backdate."' LIMIT ".$pattern_number;
    $sql_var = array(":score" => $lowest_score, ":rev_amount" => $review_number);
        try {
            $patterns = DB::query($sql, $sql_var);
        } catch (PDOException $e) {
            Logger::log(LoggingType::ERROR(), array("PDOException", "Failed to fetch patterns due to invalid restrictions", "SQL: ".$sql, "JSON VAR: ".json_encode($sql_var)));
            header("Location: ./default.php");
            exit;
        }
        // Abandon attempt if no patterns were received
        if (sizeof($patterns) == 0) {
            Logger::log(LoggingType::ERROR(), array("No patterns fitted the category requested"));
            header("Location: ./default.php");
            exit;
        }
        // Refactor data
        $data = array();
        for ($i = 0; $i < sizeof($patterns); $i++) {
            $clean_pattern = array();
            $clean_pattern["pattern_data"] = json_decode($patterns[$i]["Point_Pattern"], $assoc=TRUE);
            $clean_pattern["normalisation_constant"] = $patterns[$i]["Canvas_Size"];
            $pattern_restrictions = json_decode($patterns[$i]["Restriction_Summary"], $assoc=TRUE);
            foreach ($pattern_restrictions as $restriction_name => $restriction_outline) {
                $clean_pattern[$restriction_name] = $restriction_outline;
            }
            array_push($data, $clean_pattern);
        }
        // Write data to file
        $file_path = "./tmp/patterns.json";
        $data_file = fopen($file_path, "w");
        // To avoid issues by simply writing all in one go, write element by element
        fwrite($data_file, "[");
        fwrite($data_file, json_encode($data[0]));
        for ($i = 1; $i < sizeof($data); $i++) {
            fwrite($data_file, ",");
            fwrite($data_file, json_encode($data[$i]));
        }
        fwrite($data_file, "]");
        fclose($data_file);
        header("Content-Description: File Transfer");
        header("Content-Type: application/json");
        header("Content-Disposition: attachment; filename=patterns.json");
        header("Expires: 0");
        header("Cache-Control: must-revalidate");
        header("Content-Length: ".filesize($file_path));
        readfile($file_path);
        exit;
        // Force download of file
    } else {
        header("Location: ./default.php");
        exit;
    }
?>