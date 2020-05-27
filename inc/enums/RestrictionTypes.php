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

        public function getFormGroupRender() {
            $small_name = $this->getFunctionalName();
            $pretty_name = $this->getRenderName();
            $html = "<div class=\"form-group\">"
                  .     "<input type=\"hidden\" id=\"".$small_name."_number\" name=\"".$small_name."_number\" value=\"1\">"
                  .     "<div class=\"form-row\">"
                  .         "<div class=\"col-10\">"
                  .             "<label for=\"".$small_name."_group\">".$pretty_name." Distributions</label>"
                  .         "</div>"
                  .         "<div class=\"col-1\">"
                  .             "<button id=\"".$small_name."_remove_button\" class=\"btn btn-danger btn-sm float-right\">"
                  .                 "<i class=\"fas fa-minus\"></i>"
                  .             "</button>"
                  .         "</div>"
                  .         "<div class=\"col-1\">"
                  .             "<button id=\"".$small_name."_add_button\" class=\"btn btn-success btn-sm\">"
                  .                 "<i class=\"fas fa-plus\"></i>"
                  .             "</button>"
                  .         "</div>"
                  .     "</div>"
                  .     "<div id=\"".$small_name."_group\">"
                  .         "<div id=\"".$small_name."_1\" class=\"form-row\">"
                  .             "<div class=\"col-8\">"
                  .                 "<small id=\"".$small_name."_1_desc\" class=\"form-text text-muted ml-1\">".$pretty_name." 1</small>"
                  .                 "<input type=\"number\" id=\"".$small_name."_input_1\" name=\"".$small_name."_1\" class=\"form-control\" placeholder=\"".$pretty_name." (px)\" aria-describedby=\"".$small_name."_1_desc\"/>"
                  .             "</div>"
                  .             "<div class=\"col-4\">"
                  .                 "<input type=\"number\" id=\"".$small_name."_chance_input_1\" name=\"".$small_name."_chance_1\" min=\"1\" max=\"100\" class=\"form-control percentage_input\" placeholder=\"Likelihood\"/>"
                  .             "</div>"
                  .         "</div>"
                  .     "</div>"
                  . "</div>";
            return $html;
        }
    }
?>