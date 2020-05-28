// Define external constants
const accept_colour = new paper.Color(0.9, 1, 0.9, 1);
const reject_colour = new paper.Color(1, 0.9, 0.9, 1);
const point_colour = new paper.Color(0.9, 0.9, 1, 1);

with (paper) {
    var game = {};

    // Define basic properties
    game.canvas = $("#game_canvas");
    game.origin = new Point(0, 0);
    game.canvas_size = new Size(1024, 1024);
    // Note this just increments when points are placed and doesn't decrement when points are removed
    game.total_points_placed_number = 0;
    
    // Define list of points
    game.point_images_list = {};
    game.point_area_display_list = {};
    game.point_areas_list = {};

    // Divide canvas into quadrants
    // 0 1 ... 8
    // 9 ...
    // 17 ...
    game.canvas_sections = [];
    for (var i = 0; i < 64; i++) {
        game.canvas_sections.push([]);
    }
    // Define the variables required for caching sections
    game.last_used_section_requires_update = false;
    game.last_used_section_and_surroundings_id;
    game.last_used_section_and_surroundings = [];

    // Define which mode the game's in
    game.chaining = MAX_RADIUS > MIN_RADIUS;

    game.init = function() {
        Logger.log(LoggingType.STATUS, "Initialising Canvas");
        setup(this.canvas[0]);

        this.base_layer = new Layer();
        this.point_areas_layer = new Layer();
        this.point_area_display_layer = new Layer();
        this.points_layer = new Layer();
        this.mouse_track_layer = new Layer();
    
        // Initialise custom mouse
        this.mouse_track_layer.opacity = 0.5;
        this.mouse_validity_indicator = new Path.Circle({
            center: new Point(-15, -15),
            radius: 10
        });
        this.mouse_marker = new Path.Circle({
            center: new Point(-1, -1),
            radius: 1
        });
    
        // Initialise game_tool
        this.point_tool = new Tool();
        this.point_tool.onMouseDown = function(event) {
            game.last_used_section_requires_update = true;
            if (game.checkValidity(event.point)) {
                // Activate appropriate layer
                game.points_layer.activate();
                // Draw point onto canvas
                game.renderPoint(event.point);
            } else {
                // Fetch closest point
                var nearest_point_id = game.fetchNearestPoint(event.point);
                var nearest_point = game.point_areas_list[nearest_point_id];
                // Check whether max_r > min_r and if so if this is just not valid placement
                if (game.chaining && typeof nearest_point === "undefined") {
                    return;
                }
                // Otherwise call remove point on the point
                game.removePoint(nearest_point_id);
            }
            // After effect of click will always require update
            game.last_used_section_requires_update = true;
            // Update the mouse appearance after placing point
            game.updateMouseAppearance(event.point);
            // Render the game
            view.draw();
            event.stopPropagation();
        }

        this.point_tool.onMouseMove = function(event) {
            // Update the mouse appearance on each move
            game.updateMouseAppearance(event.point);
            // Render the game
            view.draw();
            event.stopPropagation();
        }
    }

    game.checkValidity = function(location) {
        if (this.chaining && Object.keys(game.point_areas_list).length === 0) {
            return true;
        }
        // Activate appropriate layer
        this.point_areas_layer.activate();

        // Check which quadrant the mouse is in
        var section_to_examine = this.determineSectionAndSurroundings(location);

        // Loop through all points in the section and it's surroundings (for edge cases) looking for collision
        for (var i = 0; i < section_to_examine.length; i++) {
            var index = section_to_examine[i];
            if (this.point_area_display_list[index].contains(location)) {
                return false;
            }
        }
        // If chaining check it's valid placement after checking it's not inside any points
        if (this.chaining) {
            for (var i = 0; i < section_to_examine.length; i++) {
                index = section_to_examine[i];
                if (this.point_areas_list[index].contains(location)) {
                    return true;
                }
            }
            return false;
        }
        return true;
    }
    game.clear = function() {
        // Remove every single point from all tracking lists and render
        for (var point_id in this.point_areas_list) {
            this.removePoint(point_id);
        }
        // Reset total point count
        this.total_points_placed_number = 0;
    }
    game.determineSection = function(location) {
        // Divided into 64 sections
        var section_number = this.determineSectionID(location);
        if (section_number < 0 || section_number > 63) {
            return [];
        }
        return this.canvas_sections[section_number];
    }
    game.determineSectionAndSurroundings = function(location) {
        var i = Math.floor((location.x / 1024) * 8);
        var j = Math.floor((location.y / 1024) * 8);
        var section_id = this.determineSectionID(location);
        // Trying to optimise a bit by checking if we've already formed this array
        if (!this.last_used_section_requires_update && section_id == this.last_used_section_and_surroundings_id) {
            return this.last_used_section_and_surroundings;
        }
        this.last_used_section_and_surroundings_id = section_id;
        this.last_used_section_requires_update = false;
        var resulting_array = [];
        for (var section_i = i - 1; section_i <= i + 1; section_i++) {
            if (section_i >= 0 && section_i < 8) {
                for (var section_j = j - 1; section_j <= j + 1; section_j++) {
                    if (section_j >= 0 && section_j < 8) {
                        var section_number = 8 * section_j + section_i;
                        Array.prototype.push.apply(resulting_array, this.canvas_sections[section_number]);
                    }
                }       
            }
        }
        this.last_used_section_and_surroundings = resulting_array;
        return resulting_array;
    }
    game.determineSectionID = function(location) {
        var i = Math.floor((location.x / 1024) * 8);
        var j = Math.floor((location.y / 1024) * 8);
        return 8*j + i;
    }
    game.fetchNearestPoint = function(location) {
        // Fetch appropriate sections
        var area_to_examine = this.determineSectionAndSurroundings(location);
        var closest_point_id, current_point, shortest_distance;
        for (var i = 0; i < area_to_examine.length; i++) {
            current_point = this.point_areas_list[area_to_examine[i]];
            if (this.chaining) {
                current_point = this.point_area_display_list[area_to_examine[i]];
            }
            if (current_point.contains(location)) {
                // Determine if a closest point has been set or if the current point is nearer
                if (typeof closest_point_id === "undefined" || location.getDistance(current_point.position) < shortest_distance) {
                    closest_point_id = area_to_examine[i];
                    shortest_distance = location.getDistance(current_point.position);
                } 
            }
        }
        return closest_point_id;
    }
    game.formatPointData = function() {
        var result = {"x": [], "y": []};
        var c_point, c_object;
        for (var id in this.point_images_list) {
            c_point = this.point_images_list[id];
            result.x.push(c_point.position.x);
            result.y.push(c_point.position.y);
        }
        return result;
    }
    game.removePoint = function(point_id) {
        // Get path of point from total list
        var point_path = this.point_areas_list[point_id];
        // Determine the section we're dealing with
        var section_id = this.determineSectionID(point_path.position);
        // Remove point_area path from section
        var list_of_ids = this.canvas_sections[section_id];
        list_of_ids.splice(list_of_ids.indexOf(point_id), 1);
        this.canvas_sections[section_id] = list_of_ids;
        // Remove point_area from tracking list
        this.point_areas_layer.activate();
        point_path.remove();
        delete this.point_areas_list[point_id];
        // Remove point_area_display from tracking list and rendering
        this.point_area_display_layer.activate();
        var point_area_display = this.point_area_display_list[point_id];
        point_area_display.remove();
        delete this.point_area_display_list[point_id];
        // Remove point_image from tracking list and rendering
        game.points_layer.activate();
        var point_image = this.point_images_list[point_id];
        point_image.remove();
        delete this.point_images_list[point_id];
    }
    game.renderPoint = function(location) {
        // Activate appropriate layer
        this.point_areas_layer.activate();
        // Define the point's area appearance
        var point_area = new Path.Circle({
            center: location,
            radius: MAX_RADIUS
        });
        if (this.chaining) {
            point_area = point_area.subtract(new Path.Circle({center: location, radius: MIN_RADIUS}));
        }
        // Push to own list to keep track of each point
        this.point_areas_list[this.total_points_placed_number] = point_area;
        // Do same again for point rendering
        this.point_area_display_layer.activate();
        var point_area_display = new Path.Circle({
            center: location,
            radius: MIN_RADIUS
        });
        point_area_display.fillColor = point_colour;
        // Push to own list to keep track of
        this.point_area_display_list[this.total_points_placed_number] = point_area_display;
        // Do same again for actual point
        this.points_layer.activate();
        var point_image = new Path.Circle({
            center: location,
            radius: 1
        });
        point_image.fillColor = "blue";
        this.point_images_list[this.total_points_placed_number] = point_image;

        // Push to index tracking quadrants
        this.determineSection(location).push(this.total_points_placed_number);
        this.total_points_placed_number++;
    }
    game.updateMouseAppearance = function(location) {
        this.mouse_track_layer.activate();

        // Move custom mouse to correct location
        this.mouse_marker.position = location;
        this.mouse_validity_indicator.position = location;

        // Correct custom mouse colour
        // Have used if and else because fill operation seems to take a long time and only want to call it once if possible
        if (!game.checkValidity(location)) {
            this.mouse_marker.fillColor = "red";
            this.mouse_validity_indicator.fillColor = reject_colour;
        } else {
            this.mouse_marker.fillColor = "green";
            this.mouse_validity_indicator.fillColor = accept_colour;
        }
    }
    game.submitPoints = function() {
        var process = "submitPoints";
        var data = {};
        data.expected_shape = EXPECTED_SHAPE_ID;
        data.point_pattern = this.formatPointData();
        data.limitations = {};
        data.limitations.max_radius = MAX_RADIUS;
        data.limitations.min_radius = MIN_RADIUS;
        $.ajax({
            type: "POST",
            url: "api.php",
            data: {
                "ajax_token":   AJAX_TOKEN,
                "process":      process,
                "data":         JSON.stringify(data)
            },
            success: function(data) {
                var response = JSON.parse(data);
                if (response.status === "success") {
                    Logger.log(LoggingType.STATUS, "Successfully submitted point pattern");
                    // Move user on to next screen and rate different point patterns
                } else {
                    Logger.log(LoggingType.ERROR, ["Error Code: "+response.error_code, "Message: "+respone.error_message]);
                    // Explain to user what was wrong with their submission
                }
            },
            error: function() {
                Logger.log(LoggingType.ERROR, ["Server error occurred!"]);
            }
        });
    }
}

window.onload = function() {
    game.init();
}