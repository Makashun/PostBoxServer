//XAMPP Import Command
//C:\xampp\php\php import.php

<?php
// DB Configuration
$dbHost = "localhost";
$dbUser = "root";
$dbPass = "";
$dbName = "StreetBox";

// Read JSON file
$jsonPath = $argv[1] ?? "street-box.json";
$json = file_get_contents($jsonPath);

if ($json === false) {
    die("Failed to read JSON file\n");
}

$data = json_decode($json, true); // Decode JSON as associative array

if ($data === null) {
    die("Failed to Decode Json\n");
}

// Create connection
$conn = new mysqli($dbHost, $dbUser, $dbPass);
if ($conn->connect_error) {
    die("Connection failed\n");
}
$conn->set_charset("utf8mb4");

// Create database
$sql = "CREATE DATABASE IF NOT EXISTS `$dbName` DEFAULT CHARSET=utf8mb4";
if ($conn->query($sql) === TRUE) {
    echo "Database created successfully\n";
} else {
    die("Error creating database\n");
}

// Select database
$conn->select_db($dbName);

// Drop existing table
$sql = "DROP TABLE IF EXISTS `streetBox`";
if ($conn->query($sql) === TRUE) {
    echo "Table dropped successfully\n";
} else {
    die("Error dropping table\n");
}

// Create StreetBoxes table
$sql = "CREATE TABLE `streetBox` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `locationEN` VARCHAR(255) DEFAULT NULL,
    `locationTC` VARCHAR(255) DEFAULT NULL,
    `locationSC` VARCHAR(255) DEFAULT NULL,
    `districtEN` VARCHAR(255) DEFAULT NULL,
    `districtTC` VARCHAR(255) DEFAULT NULL,
    `districtSC` VARCHAR(255) DEFAULT NULL,
    `regionEN`   VARCHAR(255) DEFAULT NULL,
    `regionTC`   VARCHAR(255) DEFAULT NULL,
    `regionSC`   VARCHAR(255) DEFAULT NULL,
    `boxNo`      VARCHAR(255) DEFAULT NULL,
    `latitude`   VARCHAR(255) DEFAULT NULL,
    `longitude`  VARCHAR(255) DEFAULT NULL,
    `weekdayCollectionTime`  VARCHAR(255) DEFAULT NULL,
    `saturdayCollectionTime` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql) === TRUE) {
    echo "Table created successfully\n";
} else {
    die("Error creating table\n");
}

// Insert data into StreetBox table
if (!empty($data['data']) && is_array($data['data'])) {
    $sql = "INSERT INTO `streetBox`
            (`locationEN`,`locationTC`,`locationSC`,
             `districtEN`,`districtTC`,`districtSC`,
             `regionEN`,`regionTC`,`regionSC`,
             `boxNo`,`latitude`,`longitude`,
             `weekdayCollectionTime`,`saturdayCollectionTime`)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        die("Prepare failed\n");
    }

    $count = 0;
    foreach ($data['data'] as $box) {
        $locationEN = $box['locationEN'] ?? null;
        $locationTC = $box['locationTC'] ?? null;
        $locationSC = $box['locationSC'] ?? null;
        $districtEN = $box['districtEN'] ?? null;
        $districtTC = $box['districtTC'] ?? null;
        $districtSC = $box['districtSC'] ?? null;
        $regionEN   = $box['regionEN']   ?? null;
        $regionTC   = $box['regionTC']   ?? null;
        $regionSC   = $box['regionSC']   ?? null;
        $boxNo      = $box['boxNo']      ?? null;
        $latitude   = $box['latitude']   ?? null;
        $longitude  = $box['longitude']  ?? null;
        $weekday    = $box['weekdayCollectionTime']  ?? null;
        $saturday   = $box['saturdayCollectionTime'] ?? null;

        $stmt->bind_param(
            "ssssssssssssss",
            $locationEN, $locationTC, $locationSC,
            $districtEN, $districtTC, $districtSC,
            $regionEN,   $regionTC,   $regionSC,
            $boxNo,      $latitude,   $longitude,
            $weekday,    $saturday
        );

        if ($stmt->execute()) {
            $count++;
        } else {
            echo "Insert failed" . $stmt->error . "\n";
        }
    }
    $stmt->close();
    echo "Inserted $count records successfully\n";
} else {
    echo "No data to insert\n";
}

$conn->close();