<div id="large-navbar" class="d-none d-lg-block text-center large-navbar">
    <div class="row w-100 m-0">
        <div class="col-4 text-left"><?php
            if ($page_title == "Home") {
                echo "<p class=\"navbar-title\">Spotting Patterns</p>";
            } else {
                echo "<a href=\"default.php\"><p class=\"navbar-title\">Spotting Patterns</p></a>";
            }
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
        <div class="col-11 text-left">
            <p class="navbar-title">Spotting Patterns</p>
        </div>
        <div class="col-1">
            <i class="fas fa-bars"></i>
        </div>
    </div>
</div>