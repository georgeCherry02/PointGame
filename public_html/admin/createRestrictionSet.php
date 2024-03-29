<?php
    $admin = TRUE;
    include_once "../../inc/base.php";
    include_once "../../inc/admin_constants.php";
    include_once "../../inc/classes/Admin.php";

    /* Error codes:
     * N.B. these are quite vague as the vast majority of validation will be done client-side
     * 0 - Server Error when inserting into database
     * 1 - No mode was set
     * 2 - One of the numbers of inputs on the form failed to come through
     * 3 - One of the probabilities or magnitudes failed to be set
     * 4 - One of the probability sets doesn't add up to 100
     * 5 - Invalid name supplied
     * 6 - Server was told the intention was to update a restriction set yet no ID was provided to update
     */
    if (Admin::isLoggedIn()) {
        // Include any additional files
        include_once "../../inc/enums/RestrictionTypes.php";
        include_once "../../inc/classes/Restrictions.php";
        include_once "../../inc/classes/Database.php";
        // First determine mode
        if (isset($_POST["create"])) {
            $set_active = FALSE;
        } else if (isset($_POST["create_and_active"])) {
            $set_active = TRUE;
        } else {
            // Redirect to admin home page
            header("Location: ./default.php?err=1");
            exit;
        }
        // Then determine whether it's updating an existing set
        $updating = isset($_POST["update_id"]);
        if ($updating) {
            $update_id = filter_input(INPUT_POST, "update_id", FILTER_VALIDATE_INT);
        }
        if ($updating && !$update_id) {
            // Redirect to admin home page
            header("Location: ./default.php?err=6");
        }
        // Then fetch the restrictions themselves
        $restrictions_outline = array();
        foreach (RestrictionTypes::ALL() as $restriction) {
            // First determine the tag being used for all names
            $small_name = $restriction->getFunctionalName();
            // Then determine how many of an individual restriction there are
            $number_of_restrictions = filter_input(INPUT_POST, $small_name."_number", FILTER_VALIDATE_INT);
            if (!$number_of_restrictions) {
                // Redirect to admin home page
                header("Location: ./default.php?err=2");
                exit;
            }
            // Then begin to loop through and create an associative array of magnitudes to probabilities
            $current_restriction_distribution = array();
            $current_restriction_distribution["magnitudes"] = array();
            $current_restriction_distribution["probabilities"] = array();
            $running_total_of_probabilities = 0;
            for ($i = 1; $i <= $number_of_restrictions; $i++) {
                $current_magnitude = filter_input(INPUT_POST, $small_name."_".$i, FILTER_VALIDATE_INT);
                $current_probability = filter_input(INPUT_POST, $small_name."_chance_".$i, FILTER_VALIDATE_INT);
                if ($current_magnitude && $current_probability) {
                    array_push($current_restriction_distribution["magnitudes"], $current_magnitude);
                    array_push($current_restriction_distribution["probabilities"], $current_probability);
                    $running_total_of_probabilities = $running_total_of_probabilities + $current_probability;
                } else {
                    // Redirect to admin home page
                    header("Location: ./default.php?err=3");
                    exit;
                }
            }
            if ($running_total_of_probabilities !== 100) {
                // Redirect to admin home page
                header("Location: ./default.php?err=4");
                exit;
            }
            $restrictions_outline[$restriction->getName()] = $current_restriction_distribution;
        }

        // Finally fetch the name of the restriction set
        $name_pattern = "/^[a-zA-Z0-9 ]{0,25}$/";
        if (preg_match($name_pattern, $_POST["name"])) {
            $name = $_POST["name"];
        } else {
            header("Location: ./default.php?err=5");
            exit;
        }

        // Having organised the restrictions to a nicer format insert into database
        if (!$updating) {
            $outcome_id = Restrictions::createNew($restrictions_outline, $name);
        } else {
            $outcome_id = Restrictions::updateSet($restrictions_outline, $name, $update_id);
        }
        // Check insert processed
        if ($outcome_id) {
            // Check if new one needs to be made active
            if ($set_active) {
                // Check if the set restriction set needs to be set active
                if ($updating) {
                    $set_active_outcome = Restrictions::setActive($update_id);
                } else {
                    $set_active_outcome = Restrictions::setActive($outcome_id);
                }
            }
        } else {
            // Redirect to admin home page
            header("Location: ./default.php?err=0");
            exit;
        }
        $new_location = "./default.php?res=";
        $result = 0;
        // Determine if program functioned as intended
        // i.e. if when told to set active it did so
        if ($set_active && $set_active_outcome) {
            $result = 1;
        } else if ($set_active) {
            $result = 2;
        }
        header("Location: ".$new_location.$result);
        exit;
    } else {
        // Redirect to landing page
        header("Location: ../header.php");
        exit;
    }
?>