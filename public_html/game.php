<?php
    include_once "../inc/base.php";
    include_once "../inc/db_constants.php";
    include_once "../inc/classes/Database.php";

    include_once "../inc/Enum.php";
    include_once "../inc/enums/Shapes.php";
    include_once "../inc/enums/RestrictionTypes.php";

    $page_title = "Game";
    include_once "../inc/components/header.php";
    include_once "../inc/components/navbar.php";

    include_once "../inc/components/ajax.php";

    // Define game parameters
    include_once "../inc/classes/Restrictions.php";
    include_once "../inc/components/game_restrictions.php";
?>
<div id="desktop_optimisation_message" class="container text-center d-flex flex-column justify-content-center d-lg-none">
    <h5 class="grey-text">Hi, this game is optimised for use on a desktop computer!</h5>
    <p class="grey-text">Please switch over to desktop to play the game and help our research!</p>
</div>
<div class="desktop_container" class="container d-none d-lg-block">
    <div id="start_message" class="container multi_collapse collapse show">
        <h3 class="grey-text">Hi and welcome to our game!</h3>
        <p class="grey-text">The basics premise of the game is you draw a named shape from placing a number of points</p>
        <p class="grey-text">Each round may have different limitations and these will be specified at the beginning of the round</p>
        <p class="grey-text">Following submission of the point distribution, you will be asked to determine the shapes others have submitted</p>
        <p class="grey-text">And then you can go through all over again!</p>
        <div class="container text-center">
            <button class="btn btn-primary highlight-background highlight-border" type="button" data-toggle="collapse" data-target=".multi_collapse" aria-controls="start_message game_container">Get Playing!</button>
        </div>
    </div>
    <div id="game_container" class="container collapse multi_collapse">
        <p class="grey-text text-center">Please draw a <span class="highlight-text"><?php echo $chosen_shape->getRenderedName(); ?></span> with at least <span class="highlight-text"><?php echo $_SESSION["minimum_number"]; ?></span> and no more than <span class="highlight-text"><?php echo $_SESSION["maximum_number"]; ?></span> points.</p>
        <i class="fas fa-trash grey-text highlight-text-hover clear_icon" onclick="game.clear()"><span class="sr-only">Clear Canvas</span></i>
        <div class="canvas-container">
            <canvas id="game_canvas" height="1024" width="1024" style="-webkit-user-drag: none; user-select: none; -webkit-tap-highlight-color: rgba(0, 0, 0, 0); width: 100%;"></canvas>
        </div>
        <button class="btn btn-primary highlight-background highlight-border" onclick="game.submitPoints()">Submit!</button>
    </div>
    <script src="./scripts/game.js" type="application/javascript"></script>
</div>
<?php
    include_once "../inc/components/footer.php";
?>