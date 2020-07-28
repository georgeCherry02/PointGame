<?php
    class CheckTypes extends Enum {
        private static $_valid_properties = array("abbreviation" => "string", "sub_checks" => "array");
        public static function Functions() { return self::_initialise(array("abbreviation" => "func", "sub_checks" => array("pcf", "nearest_neighbour", "spherical_contact", "j_function")), self::$_valid_properties); }
        public static function Graph() { return self::_initialise(array("abbreviation" => "graph", "sub_checks" => array("degree_of_vertices")), self::$_valid_properties); }
        public static function Grid() { return self::_initialise(array("abbreviation" => "grid", "sub_checks" => array()), self::$_valid_properties); }
        public static function Mask() { return self::_initialise(array("abbreviation" => "mask", "sub_checks" => array()), self::$_valid_properties); }
        public static function Statistics() { return self::_initialise(array("abbreviation" => "stat", "sub_checks" => array("mean", "stdev", "ppmcc")), self::$_valid_properties); }

        public function getAbbreviation() {
            return $this->_getProperty("abbreviation");
        }
        public function getSubChecks() {
            return $this->_getProperty("sub_checks");
        }
        public function getKey() {
            return strtolower($this->getName())."_check";
        }

        public function determineCheckActive($value) {
            $js_bool = $value ? "true" : "false";
            
            echo "const ".strtoupper($this->getName())."_CHECK_ACTIVE = ".$js_bool.";\n";
        }
    }
?>