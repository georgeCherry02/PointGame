window.onload = function() {
    // Load in canvases through ajax
    review.init();

    // Handle carousel
    // Initial setup
    review.correctCarouselControls();
    // Deal with carousel controls
    $("#reviewCarousel").on("slid.bs.carousel", review.correctCarouselControls);
}

var review = {
    review_amount: 3
};

review.correctCarouselControls = function() {
    // Reveal all carousel controls
    $(".carousel-control-prev").show();
    $(".carousel-control-next").show();
    // Hide appropriate carousel
    if ($(".carousel-inner .carousel-item:first-child").hasClass("active")) {
        $(".carousel-control-prev").hide();
    } else if ($(".carousel-inner .carousel-item:last-child").hasClass("active")) {
        $(".carousel-control-next").hide();
    }
}
review.init = function() {
    // Declare relevant scopes
    this.canvas_scopes = [new paper.PaperScope(), new paper.PaperScope(), new paper.PaperScope()];
    // Fetch data through AJAX request
    $.ajax({
        type:   "POST",
        url:    "api.php",
        data: {
            "ajax_token":   AJAX_TOKEN,
            "process":      "fetchReviewPatterns",
            "data":         "{}"
        },
        success: function(data) {
            var response = JSON.parse(data);
            if (response.status === "success") {
                if (response.less_than_expected === 0) {
                    review.point_patterns = [response.point_pattern_1, response.point_pattern_2, response.point_pattern_3];
                } else {
                    // Explain there aren't any patterns to review at the moment and move user onwards to draw more patterns!
                    // They will likely end up reviewing their own...
                }
                review.updateCanvases();
            } else {
                Logger.log(LoggingType.ERROR, ["Error Code: "+response.error_code, "Error Message: "+response.error_message]);
            }
        },
        error: function() {
            Logger.log(LoggingType.ERROR, ["Server error occured!"]);
        }
    })
}
