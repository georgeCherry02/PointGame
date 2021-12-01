<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Spotting Patterns? | <?php echo $page_title; ?></title>
        <!-- Include Bootstrap -->
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <?php
            if (isset($page_description)) {
        ?>
        <meta name="description" content="<?php echo $page_description; ?>">
        <?php
            }
        ?>
        <?php
            if ($page_title === "Home") {
        ?>
        <meta property="og:locale"      content="en_UK"/>
        <meta property="og:url"         content="https://spottingpatterns.co.uk"/>
        <meta property="og:type"        content="website"/>
        <meta property="og:title"       content="Spotting Patterns"/>
        <meta property="og:description" content="A citizen science initiative"/>
        <meta property="og:image"       content="https://spottingpatterns.co.uk/resources/fb-share-image.jpg"/>
        <?php
            }
        ?>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous"/>
        <!-- Include Basic JQuery for Bootstrap and some code -->
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <!-- Include link to FontAwesome -->
        <script src="https://kit.fontawesome.com/fd361f6e33.js"></script>
<?php
    $root_dir = "./";
    if ($page_title === "Admin") {
        $root_dir = "../";
    }
?>
        <!-- Include Custom CSS -->
        <link rel="stylesheet" href="<?php echo $root_dir; ?>css/main.css" type="text/css"/>
        <!-- Include Page's CSS -->
        <link rel="stylesheet" href="<?php echo $root_dir; ?>css/<?php echo $page_title; ?>.css" type="text/css"/>
        <!-- Include Logger script -->
        <script src="<?php echo $root_dir; ?>scripts/logging.js" type="application/javascript"></script>
        <!-- Include script for menus -->
        <script src="<?php echo $root_dir; ?>scripts/menus.js"></script>
<?php
    if ($page_title === "Game" || $page_title === "Review" || $page_title === "Gallery") {
?>
        <script src="https://unpkg.com/paper@0.11.5/dist/paper-full.min.js"></script>
<?php
    }
    if ($page_title === "Game") {
?>
        <link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
<?php
    }
?>
    </head>
    <body>