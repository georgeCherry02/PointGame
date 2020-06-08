<?php
    class Admin {
        public static function isLoggedIn() {
            if (!isset($_SESSION["AdminLoggedIn"])) {
                $_SESSION["AdminLoggedIn"] = FALSE;
            }
            return $_SESSION["AdminLoggedIn"];
            Logger::log(LoggingType::NOTICE(), array("Verified user at IP:".$_SERVER["REMOTE_ADDR"]." is admin."));
        }

        public static function logUserIn($user, $pass) {
            $_SESSION["AdminLoggedIn"] = ($user === ADMIN_USER && $pass === ADMIN_PASS);
            Logger::log(LoggingType::STATUS(), array("Logged in user as admin", "Using IP: ".$_SERVER["REMOTE_ADDR"]));
            return $_SESSION["AdminLoggedIn"];
        }

        public static function logUserOut($user, $pass) {
            $_SESSION["AdminLoggedIn"] = FALSE;
        }
    }
?>