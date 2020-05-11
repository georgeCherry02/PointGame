<?php
    include_once "../inc/base.php";

    include_once "../inc/Enum.php";
    include_once "../inc/enums/Shapes.php";

    $page_title = "Game";
    include_once "../inc/components/header.php";
    include_once "../inc/components/navbar.php";

?>
<div id="desktop_optimisation_message" class="container text-center d-flex flex-column justify-content-center d-lg-none">
    <h5 class="grey-text">Hi, this game is optimised for use on a desktop computer!</h5>
    <p class="grey-text">Please switch over to desktop to play the game and help our research!</p>
</div>
<?php
    include_once "../inc/components/footer.php";
?>