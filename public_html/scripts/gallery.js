const GALLERY_SORT_MODES = ["recent", "oldest", "best_rated", "worst_rated"];
const GALLERY_SORT_MODES_PRETTY = ["Most Recent", "Oldest", "Best Rated", "Worst Rated"];
var gallery = {};
gallery.page = 0;
gallery.last_page = false;
gallery.mode = "recent";
gallery.init = function() {
    Logger.log(LoggingType.STATUS, "Initialising Gallery Page")
    // Declare canvas scopes
    this.scopes = [];
    for (let i = 0; i < 9; i++) {
        this.scopes.push(new paper.PaperScope());
    }
    this.setupCanvases();
    this.fetchPageData();
    this.populateFilters();
    this.refreshPageNav();
}
gallery.setupCanvases = function() {
    let gallery = document.getElementById("gallery_container")
    let smaller_dim = gallery.clientWidth > gallery.clientHeight ? gallery.clientHeight : gallery.clientWidth;
    this.canvas_dim = (smaller_dim / 3) - 5;
    for (let i = 0; i < 9; i++) {
        let container = document.getElementById("gallery_container_"+i);
        let id = "gallery_canvas_"+i;
        let canvas_html = "<canvas id=\""+id+"\" style=\"background: white;\" width=\""+this.canvas_dim+"\" height=\""+this.canvas_dim+"\"></canvas>";
        let title_html = "<p><span id=\"canvas-title-"+i+"\" class=\"highlight-text\"></span> by <span id=\"canvas-author-"+i+"\" class=\"highlight-text\"></span> <span id=\"gallery-avg-rating-"+i+"\" class=\"highlight-text\"></span></p>";
        let input_html = "<input type=\"range\" id=\"gallery-score-"+i+"\" min=\"0\" max=\"100\" step=\"1\" value=\"50\" list=\"steplist\"/>"
        let confirm_html = "<i id=\"gallery-confirm-"+i+"\" class=\"fas fa-check-circle confirm-score highlight-text\" onclick=\"gallery.confirmScore("+i+")\"></i>"
        container.innerHTML = canvas_html + title_html + input_html + confirm_html;
        let scope = this.scopes[i];
        scope.activate();
        paper.setup(document.getElementById(id));
        scope.layer = new paper.Layer();
        document.getElementById("gallery-score-"+i).style.width = (this.canvas_dim*0.8)+"px";
    }
}
gallery.confirmScore = function(index) {
    let points = this.point_patterns[index];
    if (points.rated) return;
    points.rated = true;
    let value = document.getElementById("gallery-score-"+index).value;
    let data = {
        id: points["ID"],
        score: value
    }
    $.ajax({
        type: "POST",
        url: "api.php",
        data: {
            "ajax_token": AJAX_TOKEN,
            "process": "confirmPatternScore",
            "data": JSON.stringify(data)
        },
        success: function(data) {
            var response = JSON.parse(data);
            if (response.status == "success") {
                gallery.updateRating(index, response["new_score"]);
            } else {
                Logger.log(LoggingType.ERROR, ["Error Code: "+response.error_code, "Error Message: "+response.error_message]);
            }
        },
        error: function() {
            Logger.log(LoggingType.ERROR, ["Server error occured!"]);
        }
    });
}
gallery.fetchPageData = function() {
    let data = {
        page: gallery.page,
        mode: gallery.mode
    }
    $.ajax({
        type: "POST",
        url: "api.php",
        data: {
            "ajax_token": AJAX_TOKEN,
            "process": "fetchGalleryPatterns",
            "data": JSON.stringify(data)
        },
        success: function(data) {
            var response = JSON.parse(data);
            if (response.status == "success") {
                gallery.point_patterns = response.point_patterns;
                for (let i = 0; i < gallery.point_patterns.length; i++) {
                    gallery.point_patterns[i].rated = false;
                }
                gallery.last_page = response.last_page;
                if (gallery.last_page) gallery.page--;
                gallery.refreshPageNav();
                gallery.updateCanvases();
            } else {
                Logger.log(LoggingType.ERROR, ["Error Code: "+response.error_code, "Error Message: "+response.error_message]);
            }
        },
        error: function() {
            Logger.log(LoggingType.ERROR, ["Server error occured!"]);
        }
    });
}
gallery.refreshPageNav = function() {
    let prev_button = document.getElementById("prev-page-button");
    let cd = prev_button.classList.contains("disabled");
    if (this.page == 0) {
        if (!cd) prev_button.classList.add("disabled");
    } else {
        if (cd) prev_button.classList.remove("disabled");
    }
    let next_button = document.getElementById("next-page-button");
    cd = next_button.classList.contains("disabled");
    if (this.last_page) {
        if (!cd) next_button.classList.add("disabled");
    } else {
        if (cd) next_button.classList.remove("disabled");
    }
}
gallery.prevPage = function() {
    if (this.page == 0) return;
    this.page--;
    this.fetchPageData();
}
gallery.nextPage = function() {
    if (this.last_page) return;
    this.page++;
    this.fetchPageData();
}
gallery.populateFilters = function() {
    let html = "";
    for (let i = 0; i < GALLERY_SORT_MODES.length; i++) {
        let mode = GALLERY_SORT_MODES[i];
        html += "<option value=\""+mode+"\">"+GALLERY_SORT_MODES_PRETTY[i]+"</option>";
    }
    document.getElementById("filter-select").innerHTML = html;
}
gallery.updateCanvases = function() {
    for (let i = 0; i < this.point_patterns.length; i++) {
        let pattern_data = this.point_patterns[i];
        let pattern = JSON.parse(pattern_data["Point_Pattern"]);
        let radius = JSON.parse(pattern_data["Restriction_Summary"])["minimum_radius"];
        let initial_scale = pattern_data["Canvas_Size"];
        let scaling_factor = initial_scale / this.canvas_dim;
        let scope = this.scopes[i];
        scope.activate();
        scope.layer.activate();
        scope.layer.removeChildren();
        for (let colour in pattern) {
            for (let j = 0; j < pattern[colour].x.length; j++) {
                let path = new paper.Path.Circle({
                    center: new paper.Point(pattern[colour].x[j] / scaling_factor, pattern[colour].y[j] / scaling_factor),
                    radius: radius / scaling_factor
                });
                path.fillColor = colour;
            }
        }
        paper.view.draw();
        document.getElementById("canvas-title-"+i).innerHTML = pattern_data["Shape_Name"];
        document.getElementById("canvas-author-"+i).innerHTML = pattern_data["Nickname"];
        this.updateRating(i, pattern_data["Public_Review_Average"]);
    }
}
gallery.updateFilter = function(element) {
    this.mode = element.value;
    this.fetchPageData();
}
gallery.updateRating = function(index, new_score) {
    if (this.last_page) return;
    let updated_html = "("+new_score+"%)";
    document.getElementById("gallery-avg-rating-"+index).innerHTML = updated_html;
    let class_list = document.getElementById("gallery-confirm-"+index).classList;
    if (class_list.contains("disabled")) {
        if (!this.point_patterns[index].rated) {
            document.getElementById("gallery-confirm-"+index).classList.remove("disabled")
        }
    } else if (this.point_patterns[index].rated) {
        document.getElementById("gallery-confirm-"+index).classList.add("disabled");
    }
}
window.onload = function() {
    gallery.init();
}