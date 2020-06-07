window.onload = function() {
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
