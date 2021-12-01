<?php
    include_once "../inc/base.php";

    $page_title = "Gallery";
    include_once "../inc/components/header.php";
    include_once "../inc/components/navbar.php";

    include_once "../inc/components/ajax.php";
?>
<div class="filters_container">
    <div class="prev-page">
        <i id="prev-page-button" class="fas fa-angle-left highlight-text" onclick="gallery.prevPage();"></i>
    </div>
    <div class="filter-input-container">
        <select id="filter-select" onchange="gallery.updateFilter(this);">
        </select>
    </div>
    <div class="next-page">
        <i id="next-page-button" class="fas fa-angle-right highlight-text" onclick="gallery.nextPage();"></i>
    </div>
</div>
<div id="gallery_container">
<?php
    for ($i = 0; $i < 3; $i++) {
        echo "<div class=\"gallery_row\">";
        for ($j = 0; $j < 3; $j++) {
            $amount = $i * 3 + $j;
            echo "<div class=\"gallery_object\" id=\"gallery_container_".$amount."\"></div>";
        }
        echo "</div>";
    }
?>
</div>
<div class="page_control_container"></div>
<script src="./scripts/gallery.js" type="application/javascript"></script>
<?php
    include_once "../inc/components/footer.php";
?>