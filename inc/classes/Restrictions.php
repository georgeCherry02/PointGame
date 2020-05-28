<?php
    class Restrictions {

        private static $_active_restriction_set_id;

        public static function fetchAll() {
            try {
                $result = DB::query("SELECT * FROM `Restriction_Settings`");
            } catch (PDOException $e) {
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
                return false;
            }
            return $result;
        }
        public static function getRestrictionSet($id) {
            $fetch_set_sql_start = "SELECT `Name`";
            $fetch_set_sql_end = "FROM `Restriction_Settings` WHERE `ID`=:id";
            $fetch_set_Sql_variables = array(":id" => $id);
            foreach (RestrictionTypes::ALL() as $restriction) {
                $fetch_set_sql_start .= ", `".$restriction->getCapitalisedFunctionalName()."_Distributions` AS `".$restriction->getFunctionalName()."`";
            }
            $fetch_set_sql = $fetch_set_sql_start.$fetch_set_sql_end;
            try {
                $set_info = DB::query($fetch_set_sql, $fetch_set_Sql_variables)[0];
            } catch (PDOException $e) {
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
                return false;
            }
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
                    return 1;
                }
                // Set this restriction set to be active
                $outcome = self::setActive($new_active_id);
                if (!$outcome) {
                    return 1;
                }
            }
            return 0;
        }
        public static function setActive($id) {
            // Set active=0 for all entries
            $reset_active_sql = "UPDATE `Restriction_Settings` SET `Active`=0;";
            try {
                DB::query($reset_active_sql);
            } catch (PDOException $e) {
                return false;
            }
            $set_active_sql = "UPDATE `Restriction_Settings` SET `Active`=1 WHERE `ID`=:id;";
            $set_active_sql_variables = array(":id" => $id);
            try {
                DB::query($set_active_sql, $set_active_sql_variables); 
            } catch (PDOException $e) {
                return false;
            }
            self::$_active_restriction_set_id = $id;
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
                return false;
            }
            return true;
        }
    }
?>