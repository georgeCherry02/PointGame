<?php
    $sr_current_span = "<span class=\"sr-only\">(Current)</span>";
?>
<div class="navbar navbar-expand-lg">
    <div class="container">
        <?php $home_active = $page_title === "Home"; ?>
        <a class="navbar-brand highlight-text <?php if ($home_active) { echo "active"; } ?>" <?php if (!$home_active) { echo "href=\"default.php\""; } ?>>What's The Point?</a>
        <button class="navbar-toggler grey-text" type="button" data-toggle="collapse" data-target="#navbar_content" aria-expanded="false" aria-label="Toggle Navigation">
            <i class="fas fa-bars"></i>
        </button>
        <div id="navbar_content" class="navbar-collapse collapse">
            <ul class="nav navbar-nav ml-auto">
                <li class="nav-item">
                    <?php $game_active = $page_title === "Game"; ?>
                    <a class="nav-link login-signup grey-text<?php if ($game_active) { echo " active"; } ?>" href="game.php">
                        Game
                        <?php if ($game_active) { echo $sr_current_span; } ?>
                    </a>
                </li>
                <li class="dropdown">
                    <a class="nav-link dropdown-toggle grey-text" href="#" id="navbar_dropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        About
                        <span class="caret"></span>
                    </a>
                    <div class="dropdown-menu" aria-labelledby="navbar_dropdown">
                        <?php
                            $research_active = $page_title === "Research";
                            $people_active = $page_title === "People";
                        ?>
                        <a href="research.php" class="dropdown_item grey-text ml-auto<?php if ($research_active) { echo " active"; } ?>">
                            Research
                            <?php if ($research_active) {echo $sr_current_span; } ?>
                        </a><br/>
                        <a href="people.php" class="dropdown_item grey-text ml-auto<?php if ($people_active) { echo " active"; } ?>">
                            People
                            <?php if ($people_active) {echo $sr_current_span; } ?>
                        </a>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</div>