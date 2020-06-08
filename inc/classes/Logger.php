<?php
    class Logger {
        private static $_error_marker = "##########################################################################################";
        private static $_end_of_log_marker = "------------------------------------------------------------------------------------------";
        // Determine suppression in this method
        private static function check_suppression($mode) {
            switch($mode) {
                case LoggingType::ERROR():
                    return FALSE;
                case LoggingType::WARNING():
                    return FALSE;
                case LoggingType::STATUS():
                    return FALSE;
                case LoggingType::NOTICE():
                    return FALSE;
                default:
                    return TRUE;
            }
        }
        public static function log($mode, $messages) {
            // Check a valid logging mode was selected
            if (!$mode instanceof LoggingType) {
                error_log("Invalid LoggingType received by custom logger. \n".implode("\n", $messages));
                return;
            }
            // Check that the chosen mode is not being suppressed
            if (self::check_suppression($mode)) {
                return;
            }
            // Fetch the file to log to
            $file_root = $mode->getRoot();
            $dirname = dirname($file_root);
            if (!is_dir($dirname)) {
                mkdir($dirname, $mode=0777, $recursive=true);
            }
            $file = fopen($file_root, "a");
            // Flag if error
            $log_type_is_err = $mode === LoggingType::ERROR();
            // Log the message
            self::open_log($file, $log_type_is_err);
            for ($i = 0; $i < sizeof($messages); $i++) {
                fwrite($file, $messages[$i]);
                fwrite($file, "\n");
            }
            self::close_log($file, $log_type_is_err);
            fclose($file);
        }
        private static function open_log($file, $mode) {
            if ($mode === LoggingType::ERROR()) {
                fwrite($file, self::$_error_marker."\n");
                fwrite($file, "# ERROR:\n");
                fwrite($file, self::$_error_marker."\n");
            } else {
                fwrite($file, $mode->getName()."\n");
                fwrite($file, self::$_end_of_log_marker."\n");
            }
        }
        private static function close_log($file, $log_type_is_err) {
            $end = self::$_end_of_log_marker;
            if ($log_type_is_err) {
                $end = self::$_error_marker;
            }
            fwrite($file, $end."\n");
        }
    }

    class LoggingType extends Enum {
        private static $_valid_properties = array("root" => "string");
        public static function ERROR() { return self::_initialise(array("root" => "./tmp/error_logs.txt"), self::$_valid_properties); }
        public static function WARNING() { return self::_initialise(array("root" => "./tmp/error_logs.txt"), self::$_valid_properties); }
        public static function STATUS() { return self::_initialise(array("root" => "./tmp/logs.txt"), self::$_valid_properties); }
        public static function NOTICE() { return self::_initialise(array("root" => "./tmp/logs.txt"), self::$_valid_properties); }

        public function getRoot() {
            return $this->_getProperty("root");
        }
    }
?>