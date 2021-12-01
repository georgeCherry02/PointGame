<?php
    include_once "../inc/base.php";

    $page_title = "Home";
    $page_description = "Landing page for the citizen science project Spotting Patterns!";
    include_once "../inc/components/header.php";
    include_once "../inc/components/facebook_share.php";
    include_once "../inc/components/navbar.php";
?>
<div class="landing-page-jumbotron">
    <div id="hero_text_container" class="text-container">
        <h1>Spotting Patterns</h1>
        <h5 class="mt-4">A citizen science initiative</h5>
    </div>
</div>
<div class="play_button d-none d-lg-block play_button_restricted">
    <div class="link_container">
        <a href="game.php?f=0">Play Game</a>
    </div>
</div>
<div class="play_button d-none d-lg-block play_button_free">
    <div class="link_container">
        <a href="game.php?f=1">Play Without Restrictions</a>
    </div>
</div>
<div class="fb-share-button" data-href="https://spottingpatterns.co.uk" data-layout="button"></div>
<?php
    include_once "../inc/components/footer.php";
?>