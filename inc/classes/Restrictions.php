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
        public static function getCurrentRestrictions() {
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
    }
?>