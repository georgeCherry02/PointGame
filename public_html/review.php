<?php
    include_once "../inc/base.php";
    include_once "../inc/classes/Database.php";

    include_once "../inc/enums/Shapes.php";

    $page_title = "Review";
    include_once "../inc/components/header.php";
    include_once "../inc/components/navbar.php";

    if (isset($_SESSION["review_mode"]) && $_SESSION["review_mode"]) {
        include_once "../inc/components/ajax.php";
?>
<div class="container mt-4">
    <div id="reviewCarousel" class="carousel slide" data-ride="carousel" data-interval="false" data-wrap="false">
        <ol class="carousel-indicators">
            <li data-target="#reviewCarousel" data-slide-to="0" class="highlight-background active">
            <li data-target="#reviewCarousel" data-slide-to="1" class="highlight-background">
            <li data-target="#reviewCarousel" data-slide-to="2" class="highlight-background">
            <li data-target="#reviewCarousel" data-slide-to="3" class="highlight-background">
        </ol>
        <div class="carousel-inner">
<?php
    for ($i = 1; $i <= 3; $i++) {
        $html = "<div class=\"carousel-item";
        if ($i === 1) {
            $html .= " active";
        }
        $html.= "\">"
              .     "<h5 class=\"review_question grey-text\">How much does this look like a <span id=\"review_question_".$i."\" class=\"highlight-text\"></span>?</h5>"
              .     "<canvas id=\"review_canvas_".$i."\" width=\"512\" height=\"512\"></canvas>"
              .     "<div class=\"review_input_container\">"
              .         "<p class=\"min_indicator\">0</p>"
              .         "<input type=\"hidden\" id=\"review_pattern_id_".$i."\">"
              .         "<input type=\"range\" id=\"review_score_".$i."\" min=\"0\" max=\"100\" step=\"25\" value=\"50\" list=\"steplist\"/>"
              .         "<datalist id=\"steplist\">"
              .             "<option>1</option>"
              .             "<option>2</option>"
              .             "<option>3</option>"
              .             "<option>4</option>"
              .             "<option>5</option>"
              .         "</datalist>"
              .         "<p class=\"max_indicator\">100</p>"
              .     "</div>"
              . "</div>";
        echo $html;
    }
?>
            <div class="carousel-item submit-page">
                <button class="btn btn-primary highlight-background highlight-border" onclick="review.submitReviews()">Submit!</button>
            </div>
        </div>
        <a class="carousel-control-prev highlight-text" href="#reviewCarousel" role="button" data-slide="prev">
            <span><i class="fas fa-chevron-left highlight-text"></i></span>
        </a>
        <a class="carousel-control-next highlight-text" href="#reviewCarousel" role="button" data-slide="next">
            <span><i class="fas fa-chevron-right highlight-text"></i></span>
        </a>
    </div>
</div>
<script src="./scripts/review.js" type="application/javascript"></script>
<?php
    } else {
?>
<div class="container text-center game_finished_container">
    <h1 class="grey-text">Thanks for playing!</h1>
    <div class="options_container row mt-4">
        <div class="col-2"></div>
        <div class="col-4">
            <a class="btn btn-primary highlight-background highlight-border" href="game.php">Play Again!</a>
        </div>
        <div class="col-4">
            <a class="btn btn-primary highlight-background highlight-border" href="research.php">Read About Our Research</a>
        </div>
        <div class="col-2"></div>
    </div>
</div>
<?php
    }
    include_once "../inc/components/footer.php";
?>