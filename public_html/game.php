<?php
    include_once "../inc/base.php";
    include_once "../inc/classes/Database.php";

    include_once "../inc/enums/Shapes.php";
    include_once "../inc/enums/CheckTypes.php";
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
<div class="desktop_container container d-none d-lg-block">
    <div id="game_container" class="container">
        <div id="left_panel" class="text-center">
            <div class="mb-2" id="colour_palette"></div>
            <div class="mb-2">
                <label for="shape_input">Shape:</label><br/>
                <input type="text" id="shape_input"/><br/>
                <label for="name_input">Nickname:</label><br/>
                <input type="text" id="name_input"/><br/>
            </div>
            <div id="clear_button" type="button" data-toggle="modal" data-target="#clear_modal">
                <h5>Clear</h5>
            </div>
        </div>
        <div id="canvas_container" class="text-center"></div>
        <div id="right_panel" class="text-left">
            <div class="info_button" type="button" data-toggle="modal" data-target="#info_modal">
                <h5>Info</h5>
            </div>
            <div id="submit_button" type="button" data-toggle="modal" data-target="#confirmation_modal"></div>
            <h5 id="submit_button_text" type="button" data-toggle="modal" data-target="#confirmation_modal">Submit</h5>
        </div>
    </div>
    <!-- <script src="./tmp/mask.js" type="application/javascript"></script> -->
    <script>
        const BINARY_MASK = "QUICK FIX";
    </script>
    <?php
        if ($values["freeplay"]) {
    ?>
        <script src="./scripts/game-freeplay.js" type="application/javascript"></script>
    <?php
        } else {
    ?>
        <script src="./scripts/game-v1.0.0.js" type="application/javascript"></script>
    <?php
        }
    ?>
</div>
<div class="modal fade" id="confirmation_modal" tabindex="-1" role="dialog" data-backdrop="false">
    <div class="modal-dialog">
        <div class="modal-content text-center m-auto">
            <div class="modal-question-container">
                <p class="modal-question">Confirm Submission?</p>
                <div class="w-100 text-left">
                    <h5 class="modal-answer modal-answer-left" onclick="game.submitPoints()">Yes</h5>
                    <h5 class="modal-answer" type="button" data-dismiss="modal" aria-label="Close">No</h5>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="clear_modal" tabindex="-1" role="dialog" data-backdrop="false">
    <div class="modal-dialog">
        <div class="modal-content text-center m-auto">
            <div class="modal-question-container">
                <p class="modal-question">Are you sure you want to clear the canvas?</p>
                <div class="w-100 text-left">
                    <h5 class="modal-answer modal-answer-left" onclick="game.clear()" data-dismiss="modal">Yes</h5>
                    <h5 class="modal-answer" data-dismiss="modal" aria-label="Close">No</h5>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="info_modal" tabindex="-1" role="dialog" data-backdrop="false">
    <div class="modal-dialog">
        <div class="modal-content text-center m-auto">
            <h5 class="modal-title">Info</h5>
            <p>Blah de blah what's up here's a brief description of the game</p>
            <div>
                <p class="modal-question">Now are you feeling inspired?</p>
                <div class="w-100 text-left">
                    <h5 class="modal-answer modal-answer-left" onclick="game.shapeFreeField()">Yes, I have an idea!</h5>
                    <h5 class="modal-answer" onclick="game.shapeProvided()">No, Inspire me!</h5>
                </div>
            </div>
        </div>
    </div>
</div>
<?php
    include_once "../inc/components/footer.php";
?>