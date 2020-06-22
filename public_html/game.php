<?php
    include_once "../inc/base.php";
    include_once "../inc/classes/Database.php";

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
        <div class="row">
            <div class="col-2">
                <button class="btn btn-primary highlight-background highlight-border" id="submit_point_pattern" onclick="game.submitPoints()">Submit!</button>
            </div>
            <div class="col-8">
                <p class="grey-text text-center">Please draw a <span class="highlight-text"><?php echo $chosen_shape->getRenderedName(); ?></span> with at least <span class="highlight-text" id="min_number_limit"><?php echo $_SESSION["minimum_number"]; ?></span> and no more than <span class="highlight-text" id="max_number_limit"><?php echo $_SESSION["maximum_number"]; ?></span> points.</p>
                <div class="colour_palette">
                    <div class="colour_select" id="colour_select_0"></div>
                    <div class="colour_select" id="colour_select_1"></div>
                    <div class="colour_select" id="colour_select_2"></div>
                    <div class="colour_select" id="colour_select_3"></div>
                    <div class="colour_select" id="colour_select_4"></div>
                    <div class="colour_select" id="colour_select_5"></div>
                    <div class="colour_select" id="colour_select_6"></div>
                    <div class="colour_select" id="colour_select_7"></div>
                </div>
            </div>
            <div class="col-2">
                <button class="btn btn-primary highlight-background highlight-border float-right" type="button" data-toggle="modal" data-target="#clear_modal">
                    <i class="fas fa-trash"><span class="sr-only">Clear Canvas</span></i>
                </button>
            </div>
        </div>
        <div class="canvas-container">
            <canvas id="game_canvas" height="1024" width="1024" style="-webkit-user-drag: none; user-select: none; -webkit-tap-highlight-color: rgba(0, 0, 0, 0); width: 100%;"></canvas>
        </div>
    </div>
    <script src="./scripts/game.js" type="application/javascript"></script>
</div>
<div class="modal fade" id="confirmation_modal" tabindex="-1" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Confirm Submission?</h5>
            </div>
            <div class="modal-body">
                <button class="btn btn-primary highlight-background highlight-border" type="button" onclick="game.confirmPointPattern()">Yes</button>
                <button class="btn btn-primary highlight-background highlight-border ml-2" type="button" data-dismiss="modal" aria-label="Close">No</button>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="clear_modal" tabindex="-1" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Are you sure you want to clear the canvas?</h5>
            </div>
            <div class="modal-body">
                <button class="btn btn-primary highlight-background highlight-border" type="button" onclick="game.clear()" data-dismiss="modal">Yes</button>
                <button class="btn btn-primary highlight-background highlight-border ml-2" type="button" data-dismiss="modal" aria-label="Close">No</button>
            </div>
        </div>
    </div>
</div>
<?php
    include_once "../inc/components/footer.php";
?>