<?php
    $home_button_html = "<p class=\"navbar-title\">Spotting Patterns</p>";
    if ($page_title != "Home") {
        $home_button_html = "<a href=\"default.php\">".$home_button_html."</a>";
    }
?>
<div id="large-navbar" class="d-none d-lg-block text-center large-navbar">
    <div class="row w-100 m-0">
        <div class="col-4 text-left"><?php
            echo $home_button_html;
        ?></div>
        <div class="col-4"></div>
        <div class="col-2 text-right">
            <a href="people.php"><p>About us</p></a>
        </div>
        <div class="col-2">
            <a href="research.php"><p>Research</p></a>
        </div>
    </div>
</div>
<div id="small-navbar" class="d-lg-none text-center small-navbar">
    <div class="row w-100 m-0">
        <div class="col-11 text-left"><?php
            echo $home_button_html;
        ?></div>
        <div class="col-1">
            <i id="mobile_dropdown_toggle" class="fas fa-bars"></i>
        </div>
        <div id="mobile_dropdown">
            <a href="people.php"><p>About us</p></a>
            <a href="research.php"><p>Research</p></a>
        </div>
    </div>
</div>