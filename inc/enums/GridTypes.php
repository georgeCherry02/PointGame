<?php
    class GridTypes extends Enum {
        private static $_valid_properties = array();
        public static function SQUARE() { return self::_initialise(array(), self::$_valid_properties); }
        public static function HEXAGON() { return self::_initialise(array(), self::$_valid_properties); }
        public static function TRIANGLE() { return self::_initialise(array(), self::$_valid_properties); }
    }
?>