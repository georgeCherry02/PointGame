<?php
    final class Shapes extends Enum {
        private static $_valid_properties = array("pretty_render" => "string", "id" => "integer");
        public static function Circle() { return self::_initialise(array("pretty_render" => "Circle", "id" => 1), self::$_valid_properties); }
        public static function Square() { return self::_initialise(array("pretty_render" => "Square", "id" => 2), self::$_valid_properties); }
        public static function Star() { return self::_initialise(array("pretty_render" => "Star", "id" => 3), self::$_valid_properties); }

        public function getRenderedName() {
            return $this->_getProperty("pretty_render");
        }
        public function getID() {
            return $this->_getProperty("id");
        }

        public static function fromID($id) {
            return self::_fromProperty("id", $id);
        }
        public static function getRandom() {
            $new_id = rand(1, 3);
            return self::fromID($new_id);
        }
    }
?>