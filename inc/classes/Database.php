<?php
    class DB {
        private static function connect() {
            $pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8", DB_USER, DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        }
        
        public static function query($query, $params=array()) {
            $statement = self::connect()->prepare($query);
            $statement->execute($params);
            if (explode(" ", $query)[0] === "SELECT") {
                $data = $statement->fetchAll(PDO::FETCH_ASSOC);
                return $data;
            }
        }
    }
?>