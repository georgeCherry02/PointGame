<?php
    class DB {
        private static function connect() {
            $pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8", DB_USER, DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        }
        
        public static function query($query, $params=array()) {
            // Form connection
            $conn = self::connect();
            // Execute request
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            // Return data depending on request type
            $request_type = explode(" ", $query)[0];
            if ($request_type === "SELECT") {
                // If select return selected data
                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return $data;
            } else if ($request_type === "INSERT") {
                // If insert return the insert id
                $id = $conn->lastInsertId();
                return $id;
            }
        }
    }
?>