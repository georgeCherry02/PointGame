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
review.updateCanvases = function() {
    Logger.log(LoggingType.STATUS, "Setting up canvases");
    for (var i = 1; i <= this.review_amount; i++) {
        // (current point pattern)
        var cpp = this.point_patterns[i-1];
        // Update question for canvas
        $("#review_question_"+i).html(cpp["Shape_Name"]);
        // Populate the ID input
        $("#review_pattern_id_"+i).val(cpp["ID"]);
        // Begin to update canvas
        var current_scope = this.canvas_scopes[i-1];
        current_scope.activate();
        // Declare point colour
        var point_colour = new paper.Color(0.9, 0.9, 1, 1);
        // Select canvas
        paper.setup($("#review_canvas_"+i)[0]);
        // Create layers
        var point_areas = new paper.Layer();
        var point_images = new paper.Layer();
        for (var j = 0; j < cpp.x.length; j++) {
            // Note this canvas is half scale of the one it was drawn on hence the /2
            // Add all point areas
            point_areas.activate();
            var point_area = new paper.Path.Circle({
                center: new paper.Point(cpp.x[j]/2, cpp.y[j]/2),
                radius: cpp["Minimum_Radius"]/2
            });
            point_area.fillColor = point_colour;
            // Add all point images
            point_images.activate();
            var point_image = new paper.Path.Circle({
                center: new paper.Point(cpp.x[j]/2, cpp.y[j]/2),
                radius: 0.5
            });
            point_image.fillColor = "blue";
            paper.view.draw();
        }
    }
}