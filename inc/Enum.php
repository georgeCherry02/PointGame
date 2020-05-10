<?php
    abstract class Enum {
        private static $_instanced_enums;

        private $_name;
        private $_properties;

        private function __construct($properties, $name) {
            $this->_name = $name;
            $this->_properties = $properties;
        }

        private static function _fromProperty($property, $value) {
            // Attain a list of all Enums from that class
            $enum_type = get_called_class();
            $methods = self::_fetchReflectionMethods($enum_type);

            foreach ($methods as $method) {
                if ($method-> class === $enum_type) {
                    $enum_item = $method->invoke(NULL);
                    if ($enum_item instanceof $enum_type && $enum_item->_getProperty($property) === $value) {
                        return $enum_item;
                    }
                }
            }

            throw new OutOfRangeException();
        }

        public static function fromName($name) {
            // Attain a list of all Enums from that class
            $enum_type = get_called_class();
            $methods = self::_fetchReflectionMethods($enum_type);
            
            foreach ($methods as $method) {
                if ($method-> class === $enum_type) {
                    $enum_item = $method->invoke(NULL);
                    if ($enum_item instanceof $enum_type && $enum_item->getName() === $name) {
                        return $enum_item;
                    }
                }
            }

            throw new OutOfRangeException();
        }

        public static function ALL() {
            // Attain a list of all Enums from that class
            $enum_type = get_called_class();
            $methods = self::_fetchReflectionMethods($enum_type);

            $all_enums = array();
            // Verify all methods instantiate Enums
            foreach ($methods as $method) {
                if ($method-> class === $enum_type) {
                    $enum_item = $method->invoke(NULL);
                    if ($enum_item instanceof $enum_type) {
                        array_push($all_enums, $enum_item);
                    }
                }
            }

            return $all_enums;
        }

        protected static function _initialise($properties, $valid_properties) {
            // Validate properties
            foreach ($properties as $prop_name => $prop_value) {
                if (!array_key_exists($prop_name, $valid_properties) || gettype($prop_value) !== $valid_properties[$prop_name]) {
                    throw new UnexpectedValueException();
                }
            }

            if (self::$_instanced_enums === NULL) {
                self::$_instanced_enums = array();
            }

            $enum_type = get_called_class();

            if (!isset(self::$_instanced_enums[$enum_type])) {
                self::$_instanced_enums[$enum_type] = array();
            }

            $debug_trace = debug_backtrace();
            $last_caller = array_shift($debug_trace);

            while ($last_caller["class"] !== $enum_type && count($debug_trace) > 0) {
                $last_caller = array_shift($debug_trace);
            }

            $enum_name = $last_caller["function"];

            if (!isset(self::$_instanced_enums[$enum_type][$enum_name])) {
                self::$_instanced_enums[$enum_type][$enum_name] = new static ($properties, $enum_name);
            }

            return self::$_instanced_enums[$enum_type][$enum_name];
        }

        protected function _getProperty($property_name) {
            if (array_key_exists($property_name, $this->_properties)) {
                return $this->_properties[$property_name];
            } else {
                throw new OutOfBoundsException();
            }
        }

        public function getName() {
            return $this->_name;
        }

        private static function _fetchReflectionMethods($enum_type) {
            // Attain a reflection of the Enum
            $class_reflection = new ReflectionClass($enum_type);
            // Fetch all the methods that are static and public, typically the ones instantiating an enum
            return $class_reflection->getMethods(ReflectionMethod::IS_STATIC && ReflectionMethod::IS_PUBLIC);
        }
    }
?>