<?php
    final class Shapes extends Enum {
        private static $_valid_properties = array("pretty_render" => "string");
        public static function Circle() { return self::_initialise(array("pretty_render" => "Circle"), self::$_valid_properties); }
        public static function Square() { return self::_initialise(array("pretty_render" => "Square"), self::$_valid_properties); }
        public static function Star() { return self::_initialise(array("pretty_render" => "Star"), self::$_valid_properties); }

        public function getRenderedName() {
            return $this->_getProperty("pretty_render");
        }
    }
?>