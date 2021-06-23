const ACCEPT_COLOUR = new paper.Color(0.9, 1, 0.9, 1);
const REJECT_COLOUR = new paper.Color(1, 0.9, 0.9, 1);

with (paper) {

    // Define game object
    var game = {};
    game.number_of_points_placed = 0;
    game.total_number_of_points_placed = 0;
    game.point_list = {};

    game.init = function() {
        Logger.log(LoggingType.STATUS, "Initialising Canvas");

        // Setup dimensions of canvas and surrounding panels on screen
        this.determineCanvasDimensions();
        this.colour.generatePicker();
        this.setPanelPositions();

        // Setup paper.js canvas
        this.canvas = $("#game_canvas");
        setup(this.canvas[0]);

        // Setup layers
        this.points_layer = new Layer();
        this.mouse_layer = new Layer();
        this.mouse_layer.opacity = 0.5;

        this.mouse_validity_indicator = new Path.Circle({
            center: new Point(-15, -15),
            radius: 10
        });
        this.mouse_marker = new Path.Circle({
            center: new Point(-2, -2),
            radius: 2
        });

        this.point_tool = new Tool();
        this.point_tool.onMouseDown = function(event) {
            let nearest_point = game.checkForPoint(event.point);
            if (nearest_point) {
                game.removePoint(nearest_point);
            } else {
                game.addPoint(event.point);
            }
            game.sections.cached_requires_update = true;
            game.updateMouse(event.point);
        }

        this.point_tool.onMouseMove = function(event) {
            // Update the mouse appearance on each move
            game.updateMouse(event.point);
            // Render the game
            view.draw();
            event.stopPropagation();
        }
    }

    game.updateMouse = function(point_location) {
        this.mouse_layer.activate();

        // Move custom mouse to correct location
        this.mouse_marker.position = point_location;
        this.mouse_validity_indicator.position = point_location;

        // Correct custom mouse colour
        let point = this.checkForPoint(point_location);
        // Have used if and else because fill operation seems to take a long time and only want to call it once if possible
        if (!point) {
            this.mouse_marker.fillColor = "green";
            this.mouse_validity_indicator.fillColor = ACCEPT_COLOUR;
        } else {
            this.mouse_marker.fillColor = "red";
            this.mouse_validity_indicator.fillColor = REJECT_COLOUR;
        }
    }

    game.addPoint = function(point_location) {
        let point_id = this.total_number_of_points_placed;
        let [section_i, section_j, section_id] = this.sections.getLocationFromPoint(point_location);
        // Add section tracking
        this.sections.data[section_id].push(point_id);
        // Render the point
        game.points_layer.activate();
        let point = new Path.Circle({
            center: point_location,
            radius: MINIMUM_RADIUS
        })
        point.fillColor = this.colour.current;
        game.point_list[point_id] = {
            path: point,
            id: point_id
        };
        this.total_number_of_points_placed++;
        this.number_of_points_placed++;
    }
    game.removePoint = function(point) {
        point.path.remove();
        // Handle section tracking
        let [section_i, section_j, section_id] = this.sections.getLocationFromPoint(point.path.position);
        let section = this.sections.data[section_id];
        section.splice(section.indexOf(point.id), 1);
        this.sections.data[section_id] = section;
        // Remove from overall tracking
        delete this.point_list[point.id];
        // Correct amounts
        this.number_of_points_placed--;
    }
    game.clear = function() {
        for (let point_id in this.point_list) {
            game.removePoint(game.point_list[point_id]);
        }
        game.total_number_of_points_placed = 0;
        Logger.log(LoggingType.STATUS, "Removed all points from canvas");
    }
    game.submitPoints = function() {
        var process = "submitPoints";
        var data = {};
        data.freeplay = true;
        data.canvas_size = this.canvas_size.width;
        data.point_pattern = this.formatPointData();
        let shape = document.getElementById("shape_input").value;
        let name = document.getElementById("name_input").value;
        let name_pattern = /^[a-zA-Z]{1,20}$/
        if (!name_pattern.test(name)) {
            alert("Invalid nickname");
            return;
        }
        if (!name_pattern.test(shape)) {
            alert("Invalid shape name");
            return;
        }
        data.nickname = name;
        data.restrictions = {
            chosen_shape: shape,
            minimum_radius: MINIMUM_RADIUS
        }
        $.ajax({
            type: "POST",
            url: "api.php",
            data: {
                "ajax_token":   AJAX_TOKEN,
                "process":      process,
                "data":         JSON.stringify(data)
            },
            success: function(data) {
                let response = JSON.parse(data);
                if (response.status === "success") {
                    Logger.log(LoggingType.STATUS, "Successfully submitted point pattern");
                    window.location.href = "review.php";
                } else {
                    Logger.log(LoggingType.ERROR, ["Error Code: "+response.error_code, "Message: "+response.error_message]);
                }
            },
            error: function() {
                Logger.log(LoggingType.ERROR, ["Server error occured"]);
            }
        })
    }
    game.formatPointData = function() {
        let point_pattern = {};
        for (var point_id in this.point_list) {
            let path = this.point_list[point_id].path;
            let colour = path.fillColor._canvasStyle;
            if (!point_pattern.hasOwnProperty(colour)) {
                point_pattern[colour] = {
                    components: path.fillColor._components, 
                    x: [],
                    y: []
                }
            }
            point_pattern[colour].x.push(Math.floor(path.position.x));
            point_pattern[colour].y.push(Math.floor(path.position.y));
        }
        return point_pattern;
    }

    game.colour = {};
    game.colour.current = "#000000"
    game.colour.update = function() {
        let colour = document.getElementById("point_colour_input").value;
        console.log(colour);
        this.current = colour;
    }
    game.colour.generatePicker = function() {
        let html = "";
        html += "<div class=\"colour_picker_container\">"
              +     "<h5 class=\"mb-2\">Colour:</h5>"
              +     "<input type=\"color\" id=\"point_colour_input\" onchange=\"game.colour.update();\"/>"
              + "</div>";
        document.getElementById("colour_palette").innerHTML = html;
    }

    game.sections = {};
    // Divide canvas up
    // 0 1 2... 7
    // 8...
    // .
    // 56...    63
    game.sections.data = [];
    for (let i = 0; i < 64; i++) {
        game.sections.data[i] = [];
    }
    game.sections.cached_requires_update = true;
    game.sections.cached = {
        id: -1,
        data: []
    };
    game.sections.getLocationFromPoint = function(point_location) {
        let i = Math.floor(point_location.x / game.canvas_sections_size);
        let j = Math.floor(point_location.y / game.canvas_sections_size);
        let section_id = i + j*8;
        return [i, j, section_id];
    }
    game.sections.getCurrentAndSurroundings = function(point_location) {
        let [i, j, section_id] = this.getLocationFromPoint(point_location);
        // Trying to optimise a bit by checking if we've already formed this array
        if (!this.cached_requires_update && section_id == this.cached.id) {
            return this.cached.data;
        }
        var surrounding_sections = [];
        // This needs to be altered with much larger dots...
        // Currently you can't play on a screen size where this would be a problem
        let radius = 1;
        for (var section_i = i - radius; section_i <= i + radius; section_i++) {
            if (section_i >= 0 && section_i < 8) {
                for (var section_j = j - radius; section_j <= j + radius; section_j++) {
                    if (section_j >= 0 && section_j < 8) {
                        var section_number = 8 * section_j + section_i;
                        surrounding_sections.push(this.data[section_number]);
                    }
                }       
            }
        }
        this.cached.id = section_id;
        this.cached_requires_update = false;
        this.cached.data = surrounding_sections;
        return surrounding_sections;
    }

    game.checkForPoint = function(point_location) {
        let sections = this.sections.getCurrentAndSurroundings(point_location);
        for (let i = 0; i < sections.length; i++) {
            let section = sections[i];
            for (let j = 0; j < section.length; j++) {
                let point = this.point_list[section[j]];
                if (point.path.contains(point_location)) return point;
            }
        }
        return false;
    }

    game.determineCanvasDimensions = function() {
        // Determine dimensions height
        var large_viewport = window.innerWidth >= 992;
        var screen_height = window.innerHeight;
        var navbar_id = large_viewport ? "large-navbar" : "small-navbar";
        var navbar_height = parseFloat(getComputedStyle(document.getElementById(navbar_id)).height);
        var available_height = screen_height - navbar_height;
        var canvas_dimension = available_height - 36;
        this.canvas_size = new Size(canvas_dimension, canvas_dimension);
        this.canvas_sections_size = Math.floor(canvas_dimension / 8);
        var diagonal_length = canvas_dimension * Math.sqrt(2);
        var generous_diagonal_length = Math.ceil(diagonal_length / 100) * 100;
        this.canvas_diagonal_length = generous_diagonal_length;
        var html = "<canvas id=\"game_canvas\" style=\"-webkit-user-drag: none; user-select: none; -webkit-tap-highlight-color: rgba(0, 0, 0, 0); margin-top: 18px; background: white;\" width=\""+canvas_dimension+"\" height=\""+canvas_dimension+"\">"
        $("#canvas_container").html(html);
    }
    game.setPanelPositions = function() {
        var canvas_margin = ($("#game_container").width() - $("#game_canvas").width()) / 2;
        var left_panel_width = $("#clear_button").width();
        var desired_margin_from_canvas = 10;
        var left_panel_margin_left = canvas_margin - left_panel_width - desired_margin_from_canvas;
        $("#left_panel").css("margin-left", left_panel_margin_left);
        var right_panel_width = $("#submit_button").width();
        var right_panel_right = canvas_margin - right_panel_width - desired_margin_from_canvas;
        $("#right_panel").css("right", right_panel_right);
        $("#right_panel").width(right_panel_width);
        $("#right_panel").height(game.canvas_size.height);
    }

    game.shapeFreeField = function() {
        $("#info_modal").modal("hide");
    }
    game.shapeProvided = function() {
        $("#info_modal").modal("hide");
        let process = "fetchShape";
        $.ajax({
            type: "POST",
            url: "api.php",
            data: {
                "ajax_token": AJAX_TOKEN,
                "process": process,
                "data": {validate: true}
            },
            success: function(data) {
                console.log(data);
                var response = JSON.parse(data);
                if (response.status === "success") {
                    Logger.log(LoggingType.STATUS, "Successfully fetched shape: "+response.shape)
                    document.getElementById("shape_input").value = response.shape;
                } else {
                    Logger.log(LoggingType.ERROR, ["Failed to fetch shape..."]);
                }
            },
            error: function() {
                Logger.Log(LoggingType.ERROR, ["Server error"]);
            }
        });
    }
}

window.onload = function() {
    // Load information
    $("#info_modal").modal("show");
    $("#submit_button_text").hover(() => {
        var target_size = "6rem";
        var target_offset = "0px";
        $("#submit_button").width(target_size);
        $("#submit_button").height(target_size);
        $("#submit_button").css({
            "left": target_offset,
            "bottom": target_offset
        });
    });
    $("#submit_button").mouseout(() => {
        var target_size = "0px";
        var target_offset = "3rem";
        $("#submit_button").width(target_size);
        $("#submit_button").height(target_size);
        $("#submit_button").css({
            "left": target_offset,
            "bottom": target_offset
        });
    });
    // Initialise game
    game.init();
}