<!DOCTYPE html>
<html lang="en">
    <head>
        <title>What's The Point? | <?php echo $page_title; ?></title>
        <!-- Include Bootstrap -->
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous"/>
        <!-- Include Basic JQuery for Bootstrap and some code -->
        <script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>
        <!-- Include link to FontAwesome -->
        <script src="https://kit.fontawesome.com/fd361f6e33.js"></script>
        <!-- Include Custom CSS -->
        <link rel="stylesheet" href="./css/main.css" type="text/css"/>
        <!-- Include Page's CSS -->
        <link rel="stylesheet" href="./css/<?php echo $page_title; ?>.css" type="text/css"/>
        <!-- Include Logger script -->
        <script src="./scripts/logging.js" type="application/javascript"></script>
<?php
    if ($page_title === "Game") {
?>
        <script src="https://unpkg.com/paper@0.11.5/dist/paper-full.min.js"></script>
<?php
    }
?>
    </head>
    <body>