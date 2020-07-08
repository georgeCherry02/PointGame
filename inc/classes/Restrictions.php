<?php
    class Restrictions {

        private static $_active_restriction_set_id;

        public static function fetchAll() {
            try {
                $result = DB::query("SELECT * FROM `Restriction_Settings`");
            } catch (PDOException $e) {
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to fetch reviews for admin side"));
                return false;
            }
            return $result;
        }
        public static function generateGameSet() {
            $restriction_set = self::getRestrictionSet(self::getCurrentRestrictionsID());
            $game_restriction_set = array();
            foreach (RestrictionTypes::ALL() as $restriction) {
                $current_restriction_info = $restriction_set[$restriction->getFunctionalName()];
                if (sizeof($current_restriction_info->magnitudes) === 1) {
                    $game_restriction_set[$restriction->getFunctionalName()] = $current_restriction_info->magnitudes[0];
                } else {
                    $percentage = rand(1, 100);
                    $running_total = 0;
                    for ($i = 0; $i < sizeof($current_restriction_info->probabilities); $i++) {
                        $running_total = $running_total + $current_restriction_info->probabilities[$i];
                        if ($running_total >= $percentage) {
                            $game_restriction_set[$restriction->getFunctionalName()] = $current_restriction_info->magnitudes[$i];
                            break;
                        }
                    }
                }
            }
            return $game_restriction_set;
        }
        public static function getCurrentRestrictionsID() {
            if (isset(self::$_active_restriction_set_id)) {
                return self::$_active_restriction_set_id;
            }
            try {
                $result = DB::query("SELECT * FROM `Restriction_Settings` WHERE `Active`=1")[0]["ID"];
                self::$_active_restriction_set_id = $result;
            } catch (PDOException $e) {
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to fetch the current restrictions set"));
                return false;
            }
            return $result;
        }
        public static function getRestrictionSet($id) {
            $fetch_set_sql_start = "SELECT `Name`";
            $fetch_set_sql_end = "FROM `Restriction_Settings` WHERE `ID`=:id";
            $fetch_set_sql_variables = array(":id" => $id);
            foreach (RestrictionTypes::ALL() as $restriction) {
                $fetch_set_sql_start .= ", `".$restriction->getCapitalisedFunctionalName()."_Distributions` AS `".$restriction->getFunctionalName()."`";
            }
            $fetch_set_sql = $fetch_set_sql_start.$fetch_set_sql_end;
            try {
                $set_info = DB::query($fetch_set_sql, $fetch_set_sql_variables)[0];
            } catch (PDOException $e) {
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to fetch specific restrictions set"));
                return false;
            }
            // Santise set info
            foreach (RestrictionTypes::ALL() as $restriction) {
                $set_info[$restriction->getFunctionalName()] = json_decode($set_info[$restriction->getFunctionalName()]);
            }
            // Pass the ID back
            $set_info["ID"] = $id;
            return $set_info;
        }
        public static function createNew($restrictions, $name) {
            $insert_restriction_set_sql_start = "INSERT INTO `Restriction_Settings` (`Name`";
            $insert_restriction_set_sql_middle = ") VALUES (:name";
            $insert_restriction_set_sql_end = ");";
            $insert_restriction_set_sql_variables = array(":name" => $name);
            foreach (RestrictionTypes::ALL() as $restriction) {
                $insert_restriction_set_sql_start .= ", `".$restriction->getCapitalisedFunctionalName()."_Distributions`";
                $insert_restriction_set_sql_middle .= ", :".$restriction->getFunctionalName();
                $insert_restriction_set_sql_variables[":".$restriction->getFunctionalName()] = json_encode($restrictions[$restriction->getName()]);
            }
            $insert_restriction_set_sql = $insert_restriction_set_sql_start.$insert_restriction_set_sql_middle.$insert_restriction_set_sql_end;
            try {
                $res = DB::query($insert_restriction_set_sql, $insert_restriction_set_sql_variables);
            } catch (PDOException $e) {
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to insert new restriction set into database"));
                return false;
            }
            Logger::log(LoggingType::STATUS(), array("Created new restrictions set", "ID: ".$res));
            return $res;
        }
        /* Error Codes:
         * 0 - Successful operation
         * 1 - Server Error
         * 2 - Only one restriction set left
         */
        public static function removeSet($id) {
            // Check this isn't the only set
            $count_check_sql = "SELECT COUNT(`ID`) AS `Total_Count` FROM `Restriction_Settings`";
            try {
                $total_count = DB::query($count_check_sql)[0]["Total_Count"];
            } catch (PDOException $e) {
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to fetch total count when attempting to remove a restriction set"));
                return 1;
            }
            if ($total_count == 1) {
                return 2;
            }
            // Check if the set being removed is the currently active restriction set
            $need_to_set_new_active_set = self::getCurrentRestrictionsID() == $id;
            // Remove the set
            $remove_set_sql = "DELETE FROM `Restriction_Settings` WHERE `ID`=:id";
            $remove_set_sql_variables = array(":id" => $id);
            try {
                DB::query($remove_set_sql, $remove_set_sql_variables);
            } catch (PDOException $e) {
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to remove a restrictions set", "ID: ".$id));
                return 1;
            }
            // Check if the removed set was the active set
            if ($need_to_set_new_active_set) {
                // If so set first restriction active
                // Fetch first restriction
                $new_active_id_sql = "SELECT `ID` FROM `Restriction_Settings` LIMIT 1;";
                try {
                    $new_active_id = DB::query($new_active_id_sql)[0]["ID"];
                } catch (PDOException $e) {
                    Logger::log(LoggingType::ERROR(), array("PDOException", "Failed to set a new restriction set active when deleting another set", "No restriction currently active"));
                    // ##########################################################################################
                    // # Not sure whether to keep this in... will decide once hosting's sorted
                    // ##########################################################################################
                    error_log("No active sets, needs to be resolved", 1, ADMIN_EMAIL);
                    return 1;
                }
                // Set this restriction set to be active
                $outcome = self::setActive($new_active_id);
                if (!$outcome) {
                    return 1;
                }
            }
            Logger::log(LoggingType::STATUS(), array("Removed restriction set", "ID: ".$id));
            return 0;
        }
        public static function setActive($id) {
            // Set active=0 for all entries
            $reset_active_sql = "UPDATE `Restriction_Settings` SET `Active`=0;";
            try {
                DB::query($reset_active_sql);
            } catch (PDOException $e) {
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to set all restriction sets inactive"));
                return false;
            }
            $set_active_sql = "UPDATE `Restriction_Settings` SET `Active`=1 WHERE `ID`=:id;";
            $set_active_sql_variables = array(":id" => $id);
            try {
                DB::query($set_active_sql, $set_active_sql_variables); 
            } catch (PDOException $e) {
                Logger::log(LoggingType::ERROR(), array("PDOException", "Failed to set new restriction set active", "This could lead to no active restriction sets"));
                // ##########################################################################################
                // # Not sure whether to keep this in... will decide once hosting's sorted
                // ##########################################################################################
                error_log("No active sets, needs to be resolved", 1, ADMIN_EMAIL);
                return false;
            }
            self::$_active_restriction_set_id = $id;
            Logger::log(LoggingType::STATUS(), array("Successfully updated active restriction set", "ID: ".$id));
            return true;
        }

        public static function updateSet($restrictions_outline, $name, $update_id) {
            $update_sql = "UPDATE `Restriction_Settings` SET `Name`=:name";
            $update_sql_variables = array(":name" => $name);
            foreach (RestrictionTypes::ALL() as $restriction) {
                $update_sql .= ", `".$restriction->getCapitalisedFunctionalName()."_Distributions`=:".$restriction->getFunctionalName();
                $update_sql_variables[":".$restriction->getFunctionalName()] = json_encode($restrictions_outline[$restriction->getName()]);
            }
            $update_sql .= " WHERE `ID`=:id";
            $update_sql_variables[":id"] = $update_id;
            try {
                DB::query($update_sql, $update_sql_variables);
            } catch (PDOException $e) {
                Logger::log(LoggingType::WARNING(), array("PDOException", "Failed to update a restriction set to new settings"));
                return false;
            }
            Logger::log(LoggingType::STATUS(), array("Successfully updated restriction set", "ID: ".$update_id));
            return true;
        }

        public static function manageCheckType($check_type, $values) {
            switch($check_type) {
                case CheckTypes::Functions():
                    if ($values["j_function"]["active"] && !($values["nearest_neighbour"]["active"] && $values["spherical_contact"]["active"])) {
                        $values["j_function"]["active"] = false;
                    }
                    break;
                case CheckTypes::Graph():
                    if ($_SESSION["max_radius"] < $_SESSION["min_radius"]) {
                        echo "const NEIGHBOURING_DISTANCE = ".$values["neighbouring_distance"].";\n";
                    }
                    $js_bool = $values["intersecting_edge"] ? "true" : "false";
                    echo "const INTERSECTING_EDGE_CHECK_ACTIVE = ".$js_bool.";\n";
                    $js_bool = $values["graph_render"] ? "true" : "false";
                    echo "const GRAPH_RENDER = ".$js_bool.";\n";
                    break;
                case CheckTypes::Grid():
                    echo "const GRID_MODE = '".$values["grid_mode"]."';\n";
                    echo "const GRID_RESOLUTION = ".$values["grid_resolution"].";\n";
                    $js_bool = $values["grid_render"] ? "true" : "false";
                    echo "const GRID_RENDER = ".$js_bool.";\n";
                    echo "const MAX_NUMBER_PER_GRID_CELL_DISTRIBUTION = ".$values["max_grid_density"].";\n";
                    echo "const MIN_NUMBER_PER_GRID_CELL_DISTRIBUTION = ".$values["min_grid_density"].";\n";
                    break;
                case CheckTypes::Mask():
                    echo "const MASK_ROOT = ".$values["mask_root"].";\n";
                    break;
                case CheckTypes::Statistics():
                    if (!$values["mean"]["active"]) {
                        $values["stdev"]["active"] = false;
                        $values["ppmcc"]["active"] = false;
                    } 
                    if (!$values["stdev"]["active"]) {
                        $values["ppmcc"] = false;
                    }
                    break;
            }
            foreach ($check_type->getSubChecks() as $sub_check) {
                $js_bool = $values[$sub_check]["active"] ? "true" : "false";
                echo "const ".strtoupper($sub_check)."_CHECK_ACTIVE = ".$js_bool.";\n";
                if ($values[$sub_check]["active"]) {
                    echo "const ".strtoupper($sub_check)."_LIMITATIONS = ".$values[$sub_check]["value"].";\n";
                }
            }
        }
    }
?>