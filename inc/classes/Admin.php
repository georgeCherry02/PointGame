<?php
    class Admin {
        public static function isLoggedIn() {
            if (!isset($_SESSION["AdminLoggedIn"])) {
                $_SESSION["AdminLoggedIn"] = FALSE;
            }
            return $_SESSION["AdminLoggedIn"];
        }

        public static function logUserIn($user, $pass) {
            $_SESSION["AdminLoggedIn"] = ($user === ADMIN_USER && $pass === ADMIN_PASS);
            return $_SESSION["AdminLoggedIn"];
        }

        public static function logUserOut($user, $pass) {
            $_SESSION["AdminLoggedIn"] = FALSE;
        }
    }
?>