// Define external constants
const accept_colour = new paper.Color(0.9, 1, 0.9, 1);
const reject_colour = new paper.Color(1, 0.9, 0.9, 1);
const point_colour = new paper.Color(0.9, 0.9, 1, 1);

const GIVEN_SHAPE = FALSE;
const NUMBER_WITHIN = 3;

with (paper) {
    var game = {};
    // Define basic properties
    game.canvas = $("#game_canvas");
    game.origin = new Point(0, 0);
    game.canvas_size = new Size(1024, 1024);
    // Note this just increments when points are placed and doesn't decrement when points are removed
    game.number_of_points_placed = 0;
    game.total_number_of_points_placed = 0;
    
    // Define list of points
    game.point_images_list = {};
    game.point_area_display_list = {};
    game.point_areas_list = {};

    // Define which mode the game's in
    game.chaining = MAX_RADIUS > MIN_RADIUS;

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


    game.init = function() {
        Logger.log(LoggingType.STATUS, "Initialising Canvas");
        setup(this.canvas[0]);

        this.base_layer               = new Layer();
        this.point_areas_layer        = new Layer();
        this.point_area_display_layer = new Layer();
        this.points_layer             = new Layer();
        this.mouse_track_layer        = new Layer();
    
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
        var distance_validity = game.restrictions.distance.checkDistance(location)
        return distance_validity;
    }
    game.clear = function() {
        // Remove every single point from all tracking lists and render
        for (var point_id in this.point_areas_list) {
            this.removePoint(point_id);
        }
        // Reset total point count
        this.total_number_of_points_placed = 0;
        this.number_of_points_placed = 0;
        Logger.log(LoggingType.STATUS, "Removed all points from canvas");
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
        Logger.log(LoggingType.STATUS, "Formatting point data");
        var result = {"x": [], "y": []};
        var c_point, c_object;
        for (var id in this.point_images_list) {
            c_point = this.point_images_list[id];
            result.x.push(Math.floor(c_point.position.x));
            result.y.push(Math.floor(c_point.position.y));
        }
        return result;
    }
    game.removePoint = function(point_id) {
        Logger.log(LoggingType.NOTICE, "Removing point");
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
        this.number_of_points_placed--;
    }
    game.renderPoint = function(location) {
        Logger.log(LoggingType.NOTICE, "Adding point");
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
        this.point_areas_list[this.total_number_of_points_placed] = point_area;
        // Do same again for point rendering
        this.point_area_display_layer.activate();
        var point_area_display = new Path.Circle({
            center: location,
            radius: MIN_RADIUS
        });
        point_area_display.fillColor = point_colour;
        // Push to own list to keep track of
        this.point_area_display_list[this.total_number_of_points_placed] = point_area_display;
        // Do same again for actual point
        this.points_layer.activate();
        var point_image = new Path.Circle({
            center: location,
            radius: 1
        });
        point_image.fillColor = "blue";
        this.point_images_list[this.total_number_of_points_placed] = point_image;

        // Push to index tracking quadrants
        this.determineSection(location).push(this.total_number_of_points_placed);
        this.total_number_of_points_placed++;
        this.number_of_points_placed++;
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
    game.showSubmitError = function(minimum_number) {
        // Fetch text that condition wasn't met for
        var highlight_text_type = minimum_number ? "min" : "max";
        var highlight_text = $("#"+highlight_text_type+"_number_limit");
        // Fetch submit button
        var submit_button = $("#submit_point_pattern");
        // Set condition to be red
        highlight_text.addClass("limitation_error_text");
        // Vibrate submit_button
        submit_button.effect("shake", {distance: 1});
    }
    game.submitPoints = function() {
        Logger.log(LoggingType.NOTICE, "Submitting point pattern to server");
        var process = "submitPoints";
        var data = {};
        data.expected_shape = EXPECTED_SHAPE_ID;
        data.point_pattern = this.formatPointData();
        // Validate the number of points client side too
        if (data.point_pattern.x.length < MIN_NUMBER) {
            this.showSubmitError(true);
            Logger.log(LoggingType.NOTICE, "Too few points to be submitted");
            return;
        } 
        if (data.point_pattern.x.length > MAX_NUMBER) {
            this.showSubmitError(false);
            Logger.log(LoggingType.NOTICE, "Too many points to be submitted");
            return;
        }
        if (data.point_pattern.x.length !== data.point_pattern.y.length) {
            Logger.log(LoggingType.ERROR, ["Point formatting process failed", "Substantial error with page", "Reloading"]);
            location.reload();
            return;
        }
        data.limitations = {};
        data.limitations.maximum_radius = MAX_RADIUS;
        data.limitations.minimum_radius = MIN_RADIUS;
        data.limitations.maximum_number = MAX_NUMBER;
        data.limitations.minimum_number = MIN_NUMBER;
        $.ajax({
            type:   "POST",
            url:    "api.php",
            data: {
                "ajax_token":   AJAX_TOKEN,
                "process":      process,
                "data":         JSON.stringify(data)
            },
            success: function(data) {
                var response = JSON.parse(data);
                if (response.status === "success") {
                    Logger.log(LoggingType.STATUS, "Successfully submitted point pattern");
                    // Update the current pattern id
                    game.current_pattern_id = response.insert_id;
                    // Bring up submission confirmation screen
                    $("#confirmation_modal").modal("show");
                } else {
                    Logger.log(LoggingType.ERROR, ["Error Code: "+response.error_code, "Message: "+respone.error_message]);
                    // ###################################################################################################################
                    // # Explain to user what was wrong with their submission
                    // # Note this should be quite difficult to get to without malicious activity, so maybe just redirect is solution
                    // ###################################################################################################################
                }
            },
            error: function() {
                Logger.log(LoggingType.ERROR, ["Server error occurred!"]);
            }
        });
    }
    game.confirmPointPattern = function() {
        Logger.log(LoggingType.NOTICE, "Confirming point pattern with server");
        var process = "confirmSubmission";
        var data = {"confirm_id": game.current_pattern_id};
        $.ajax({
            type:   "POST",
            url:    "api.php",
            data: {
                "ajax_token":   AJAX_TOKEN,
                "process":      process,
                "data":         JSON.stringify(data)
            },
            success: function(data) {
                var response = JSON.parse(data);
                if (response.status === "success") {
                    Logger.log(LoggingType.STATUS, "Confirmed Point Pattern");
                    // Redirect to review page
                    window.location.href = "review.php";
                } else {
                    Logger.log(LoggingType.ERROR, ["Error Code: "+response.error_code, "Message: "+response.error_message]);
                }
            },
            error: function() {
                Logger.log(LoggingType.ERROR, ["Server error occured!"]);
            }
        });
    }
    
    // Restrictions functionality
    game.restrictions = {}
    // ------------------------------------------------------------------------------------------
    // Implement distance based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.distance = {}
    // ##########################################################################################
    // # This will become problematic once max_distance > 128
    // # Is this going to be a problem?
    // ##########################################################################################
    game.restrictions.distance.checkDistance = function(location) {
        // Check if there are any points already existing, otherwise this questions irrelevant
        if (Object.keys(game.point_areas_list).length === 0) {
            return true;
        }

        // Check which quadrant the mouse is in
        var points_of_interest = game.determineSectionAndSurroundings(location);

        // Loop through all points in the section and it's surroundings (for edge cases) looking for collision within min distance
        var min_distance = this.checkMinimumDistance(location, points_of_interest);
        // Break function early if point is inside another to avoid second loop
        if (!min_distance) {
            return false;
        }

        // If chaining check it's valid placement after checking it's not inside any points
        // I.e. check if it's within the required number of points
        var max_distance = true;
        if (game.chaining) {
            max_distance = this.checkMaxDistance(location, points_of_interest);
        }

        return max_distance;
    }
    game.restrictions.distance.checkMinimumDistance = function(location, point_ids) {
        for (var i = 0; i < point_ids.length; i++) {
            if (game.point_area_display_list[point_ids[i]].contains(location)) {
                return false;
            }
        }
        return true;
    }
    game.restrictions.distance.checkMaxDistance = function(location, point_ids, removal_shift=false) {
        var current_number_within_range = removal_shift ? -1 : 0;
        for (var i = 0; i < point_ids.length; i++) {
            if (game.point_areas_list[point_ids[i]].contains(location)) {
                current_number_within_range++;
                // Check if the point's within range of enough other points to be placed
                if (current_number_within_range >= NUMBER_WITHIN) {
                    return true;
                }
            }
        }
        // Check if there are less points than required, and in which case return whether all are within range
        if (game.number_of_points_placed < NUMBER_WITHIN) {
            return current_number_within_range === game.number_of_points_placed;
        }
        return false;
    }
    game.restritions.checkGivenShape() = function(location) {

    }
}

window.onload = function() {
    game.init();
}