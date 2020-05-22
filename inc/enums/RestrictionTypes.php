<?php
    class RestrictionTypes extends Enum {
        private static $_valid_properties = array("functional_name" => "string");
        public static function MinimumRadius() { return self::_initialise(array("functional_name" => "Minimum_Radius"), self::$_valid_properties); }
        public static function MaximumRadius() { return self::_initialise(array("functional_name" => "Maximum_Radius"), self::$_valid_properties); }
        public static function MinimumNumber() { return self::_initialise(array("functional_name" => "Minimum_Number"), self::$_valid_properties); }
        public static function MaximumNumber() { return self::_initialise(array("functional_name" => "Maximum_Number"), self::$_valid_properties); }

        public function getCapitalisedFunctionalName() {
            return $this->_getProperty("functional_name");
        }
        public function getFunctionalName() {
            return strtolower($this->_getProperty("functional_name"));
        }
        public function getRenderName() {
            return str_replace("_", " ", $this->_getProperty("functional_name"));
        }
    }
?>