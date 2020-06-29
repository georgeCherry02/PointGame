// Define external constants
const accept_colour = new paper.Color(0.9, 1, 0.9, 1);
const reject_colour = new paper.Color(1, 0.9, 0.9, 1);

// Restrictions outline
// ##########################################################################################
// # Consider rewriting this to represent a neighbour number
// ##########################################################################################
const NUMBER_WITHIN = 1;
const RENDER_GRID = false;
const GRID_MODE = "SQUARE";
const GRID_RESOLUTION = 32;
const MAX_NUMBER_PER_GRID_CELL = 2;
const MIN_NUMBER_PER_GRID_CELL = 0;
const MAX_NUMBER_PER_GRID_CELL_DISTRIBUTION = {"2": 19, "3": 50, "4": 30, "5": 1};
const MIN_NUMBER_PER_GRID_CELL_DISTRIBUTION = {"0": 99, "1": 1};
const POINT_COLOURS = ["#5EB1BF", "#6C5EBF", "#9D5EBF", "#BF5EB1", "#BF5E80", "#BF6C5E", "#BF9D5E", "#81BF5E"];
const MEAN_RESTRICTION_X = 32;
const MEAN_RESTRICTION_Y = 32;
const MEAN_PATH_SIZE = 32;
const PCF_LIMITATIONS = {"short": {"range": 32, "average_low": 0, "average_high": Infinity}, "medium": {"range": 128, "average_low": 0, "average_high": Infinity}, "long": {"average_low": 0, "average_high": Infinity}};
const MAXIMUM_NUMBER_OF_VERTICES = 5;

// -------------------------------------
// Which restrictions are active
// -------------------------------------
const GRAPH_CHECK_ACTIVE        = false;
// Sub graph checks
const INTERSECTING_EDGE_CHECK   = false;
const NUMBER_OF_VERTICES_CHECK  = false;
// -------------------------------------
const GRID_CHECK_ACTIVE         = true;
// Sub graph checks
const COMPLEX_DENSITY_ACTIVE    = true;
// -------------------------------------
const STATISTIC_CHECK_ACTIVE    = false;
// Sub statistic checks
const MEAN_CHECK_ACTIVE         = false;
// -------------------------------------
const MASK_CHECK_ACTIVE         = false;
// -------------------------------------
const FUNCTION_CHECK_ACTIVE     = false;
// Sub function checks
const PCF_CHECK_ACTIVE          = false;
// -------------------------------------

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
        this.point_area_display_layer.opacity = 0.25;
        this.points_layer             = new Layer();
        this.graph_layer              = new Layer();
        this.graph_layer.visible      = false;
        this.grid_layer               = new Layer();
        this.grid_layer.opacity       = 0.2;
        this.mean_path_layer          = new Layer();
        this.mean_path_layer.opacity  = 0.2;
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
            if (game.restrictions.checkPlacementValidity(event.point)) {
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
                // Otherwise remove point after validation
                if (game.restrictions.validatePointRemoval(nearest_point_id)) {
                    game.removePoint(nearest_point_id);
                }
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

        this.restrictions.grid.initialiseGrid();
        this.restrictions.colour.initialisePalette();
        this.restrictions.statistics.initialiseMeanRestriction();
        this.restrictions.functions.initialisePCF();
    }
    game.clear = function() {
        // Remove every single point from all tracking lists and render
        for (var point_id in this.point_areas_list) {
            this.removePoint(point_id);
        }
        // Reset total point count
        this.total_number_of_points_placed = 0;
        Logger.log(LoggingType.STATUS, "Removed all points from canvas");
    }
    game.determineSection = function(point_location) {
        // Divided into 64 sections
        var section_number = this.determineSectionID(point_location);
        if (section_number < 0 || section_number > 63) {
            return [];
        }
        return this.canvas_sections[section_number];
    }
    game.determineSectionAndSurroundings = function(point_location) {
        var i = Math.floor((point_location.x / 1024) * 8);
        var j = Math.floor((point_location.y / 1024) * 8);
        var section_id = this.determineSectionID(point_location);
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
    game.determineSectionID = function(point_location) {
        var i = Math.floor((point_location.x / 1024) * 8);
        var j = Math.floor((point_location.y / 1024) * 8);
        return 8*j + i;
    }
    game.fetchNearestPoint = function(point_location) {
        // Fetch appropriate sections
        var area_to_examine = this.determineSectionAndSurroundings(point_location);
        var closest_point_id, current_point, shortest_distance;
        for (var i = 0; i < area_to_examine.length; i++) {
            current_point = this.point_areas_list[area_to_examine[i]];
            if (this.chaining) {
                current_point = this.point_area_display_list[area_to_examine[i]];
            }
            if (current_point.contains(point_location)) {
                // Determine if a closest point has been set or if the current point is nearer
                if (typeof closest_point_id === "undefined" || point_location.getDistance(current_point.position) < shortest_distance) {
                    closest_point_id = area_to_examine[i];
                    shortest_distance = point_location.getDistance(current_point.position);
                } 
            }
        }
        return closest_point_id;
    }
    game.formatPointData = function() {
        Logger.log(LoggingType.NOTICE, "Formatting point data");
        var result = {"x": [], "y": [], "c": []};
        var c_point, c_object;
        for (var id in this.point_images_list) {
            c_point = this.point_images_list[id];
            result.x.push(Math.floor(c_point.position.x));
            result.y.push(Math.floor(c_point.position.y));
            result.c.push(Math.floor(this.restrictions.colour.tracking[id]));
        }
        return result;
    }
    game.removePoint = function(point_id) {
        Logger.log(LoggingType.NOTICE, "Removing point");
        // Get path of point from total list
        var point_path = this.point_areas_list[point_id];
        // Remove the point from the PCF
        this.restrictions.functions.removePoint(point_path.position, point_id);
        // Remove the point from the graph tracking 
        this.restrictions.graph_model.removeNode(point_id);
        // Remove the point from the grid tracking
        this.restrictions.grid.removePoint(point_path.position, point_id);
        // Remove from colour tracking
        delete this.restrictions.colour.tracking[point_id];
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

        // Update mean and standard dev
        this.restrictions.statistics.update();

        // Decrease point tally
        this.number_of_points_placed--;
    }
    game.renderPoint = function(point_location) {
        Logger.log(LoggingType.NOTICE, "Adding point");
        // Update the function based restrictions
        this.restrictions.functions.addPoint(point_location, this.total_number_of_points_placed);
        // Update the neighbours map
        this.restrictions.graph_model.addNode(point_location, this.total_number_of_points_placed);
        // Update the grid map
        if (!this.restrictions.grid.addPoint(point_location, this.total_number_of_points_placed)) {
            // If the grid add failed remove graph node
            Logger.log(LoggingType.ERROR, ["Failed to render point", "Removing node from graph tracking"]);
            this.restrictions.graph_model.removeNode(this.total_number_of_points_placed);
            return;
        }
        // Update the points tracking
        this.restrictions.colour.tracking[this.total_number_of_points_placed] = this.restrictions.colour.current_index;
        
        // Push to index tracking quadrants
        this.determineSection(point_location).push(this.total_number_of_points_placed);

        // Activate appropriate layer
        this.point_areas_layer.activate();
        // Define the point's area appearance
        var point_area = new Path.Circle({
            center: point_location,
            radius: MAX_RADIUS
        });
        if (this.chaining) {
            point_area = point_area.subtract(new Path.Circle({center: point_location, radius: MIN_RADIUS}));
        }
        // Push to own list to keep track of each point
        this.point_areas_list[this.total_number_of_points_placed] = point_area;
        // Do same again for point rendering
        this.point_area_display_layer.activate();
        var point_area_display = new Path.Circle({
            center: point_location,
            radius: MIN_RADIUS
        });
        point_area_display.fillColor = this.restrictions.colour.current;
        // Push to own list to keep track of
        this.point_area_display_list[this.total_number_of_points_placed] = point_area_display;
        // Do same again for actual point
        this.points_layer.activate();
        var point_image = new Path.Circle({
            center: point_location,
            radius: 1
        });
        point_image.fillColor = this.restrictions.colour.current;
        this.point_images_list[this.total_number_of_points_placed] = point_image;

        // Update mean and standard dev
        this.restrictions.statistics.update();

        // Increase point tallies
        this.total_number_of_points_placed++;
        this.number_of_points_placed++;
    }
    game.updateMouseAppearance = function(point_location) {
        this.mouse_track_layer.activate();

        // Move custom mouse to correct location
        this.mouse_marker.position = point_location;
        this.mouse_validity_indicator.position = point_location;

        // Correct custom mouse colour
        // Have used if and else because fill operation seems to take a long time and only want to call it once if possible
        if (!game.restrictions.checkPlacementValidity(point_location)) {
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
            window.location.reload();
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
    // Implement general restriction functions
    // ------------------------------------------------------------------------------------------
    game.restrictions.checkPlacementValidity = function(point_location) {
        // Make sure point_location is valid
        if (point_location.x < 0 || point_location.x > 1024 || point_location.y < 0 || point_location.y > 1024) {
            return false;
        }
        // To optimise try to check in order that will require least operations first
        if (MASK_CHECK_ACTIVE && !this.mask.check(point_location)) {
            Logger.log(LoggingType.NOTICE, "Outside binary mask");
            return false;
        }
        if (STATISTIC_CHECK_ACTIVE && !this.statistics.check(point_location)) {
            Logger.log(LoggingType.NOTICE, "Outside of mean restrictions");
            return false;
        }
        if (GRID_CHECK_ACTIVE && !this.grid.check(point_location)) {
            Logger.log(LoggingType.NOTICE, "Placement within grid is invalid");
            return false;
        }
        // Distance check must be kept active all times
        if (!this.distance.check(point_location)) {
            Logger.log(LoggingType.NOTICE, "Distance from other points invalid");
            return false;
        }
        if (FUNCTION_CHECK_ACTIVE && !this.functions.check(point_location)) {
            Logger.log(LoggingType.NOTICE, "Statistics check invalid");
            return false;
        }
        if (GRAPH_CHECK_ACTIVE && !this.graph_model.check(point_location)) {
            Logger.log(LoggingType.NOTICE, "Failed Graph checks");
            return false;
        }
        return true;
    }
    game.restrictions.validatePointRemoval = function(point_id) {
        var point_path = game.point_areas_list[point_id];
        if (GRID_CHECK_ACTIVE && !this.grid.check(point_path.position, removal=true)) {
            Logger.log(LoggingType.NOTICE, "Illegal point removal");
            return false;
        }
        if (game.chaining) {
            var points_of_interest = game.determineSectionAndSurroundings(point_path.position);
            var affected_points = [];
            for (var i = 0; i < points_of_interest.length; i++) {
                var id = points_of_interest[i];
                if (id == point_id) {
                    continue;
                }
                var c_point = game.point_areas_list[id];
                if (c_point.position.getDistance(point_path.position) < MAX_RADIUS) {
                    affected_points.push(id);
                }
            }
            // Checks if it's the last node on a chain in which case can always be deleted
            if (affected_points.length !== 1) {
                for (var i = 0; i < affected_points.length; i++) {
                    var affected_id = affected_points[i];
                    var point_position = game.point_areas_list[affected_id].position;
                    // Need to check two restrictions for each point
                    // (a) Is it still connected to all the other affected points
                    // (b) Is it still connected to the minimum number of points
                    // Checks (a)
                    var valid_connection = true;
                    var secondary_affected_id;
                    for (var j = i + 1; j < affected_points.length; j++) {
                        secondary_affected_id = affected_points[j];
                        // Checks if i is connected to each point above it in adjacent nodes list
                        var i_conn_j = this.graph_model.findConnection(affected_id, secondary_affected_id, point_id);
                        if (!i_conn_j) {
                            valid_connection = false;
                            Logger.log(LoggingType.STATUS, "Couldn't find a connection between points "+affected_id+" and "+secondary_affected_id);
                            Logger.log(LoggingType.STATUS, "Removed point: "+point_id);
                            if (j == point_id) {
                                Logger.log(LoggingType.ERROR, ["And this was because the deleted point somehow got in?"]);
                            }
                        }
                    }
                    // Checks (b)
                    valid_number_of_connections = this.distance.checkMaxDistance(point_position, game.determineSectionAndSurroundings(point_position), true);
                    if (!valid_connection || !valid_number_of_connections) {
                        Logger.log(LoggingType.STATUS, "Failed to remove point as it would have broken restrictions");
                        Logger.log(LoggingType.STATUS, "Valid Connection: "+valid_connection);
                        Logger.log(LoggingType.STATUS, "Valid Number of Connections: "+valid_number_of_connections);
                        return false;
                    }
                }
            }
        }
        return true;
    }
    // ------------------------------------------------------------------------------------------
    // Implement distance based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.distance = {}
    // ##########################################################################################
    // # This will become problematic once max_distance > 128
    // # Is this going to be a problem?
    // ##########################################################################################
    game.restrictions.distance.check = function(point_location) {
        // Check if there are any points already existing, otherwise this questions irrelevant
        if (Object.keys(game.point_areas_list).length === 0) {
            return true;
        }

        // Check which quadrant the mouse is in
        var points_of_interest = game.determineSectionAndSurroundings(point_location);

        // Loop through all points in the section and it's surroundings (for edge cases) looking for collision within min distance
        var min_distance = this.checkMinimumDistance(point_location, points_of_interest);
        // Break function early if point is inside another to avoid second loop
        if (!min_distance) {
            return false;
        }

        // If chaining check it's valid placement after checking it's not inside any points
        // I.e. check if it's within the required number of points
        var max_distance = true;
        if (game.chaining) {
            max_distance = this.checkMaxDistance(point_location, points_of_interest);
        }

        return max_distance;
    }
    game.restrictions.distance.checkMinimumDistance = function(point_location, point_ids) {
        for (var i = 0; i < point_ids.length; i++) {
            if (game.point_area_display_list[point_ids[i]].contains(point_location)) {
                return false;
            }
        }
        return true;
    }
    game.restrictions.distance.checkMaxDistance = function(point_location, point_ids, removal_shift=false) {
        var current_number_within_range = removal_shift ? -1 : 0;
        for (var i = 0; i < point_ids.length; i++) {
            if (game.point_areas_list[point_ids[i]].contains(point_location)) {
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
    // ------------------------------------------------------------------------------------------
    // Implement graph based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.graph_model = {}
    // Initialise neighbour distance
    game.restrictions.graph_model.neighbour_distance = MIN_RADIUS + 10;
    if (game.chaining) {
        game.restrictions.graph_model.neighbour_distance = MAX_RADIUS;
    }
    // Initialise neigbouring map
    game.restrictions.graph_model.graph = {}
    // Adds an item to the graph and updates it's neighbouring nodes
    game.restrictions.graph_model.addNode = function(point_location, point_id) {
        Logger.log(LoggingType.NOTICE, "Adding node to graph tracking");
        // Activate appropriate layer
        var neighbouring_points = this.determineNeighbours(point_location);
        game.graph_layer.activate();
        var c_id, c_point, c_edge, c_distance;
        var adjacent_nodes = {"ids": [], "paths": []};
        game.restrictions.functions.nearest_neighbour[point_id] = Infinity;
        for (var i = 0; i < neighbouring_points.length; i++) {
            c_id = neighbouring_points[i];
            c_point = game.point_areas_list[c_id];
            c_edge = new Path.Line(point_location, c_point.position);
            c_distance = Math.floor(c_edge.length);
            adjacent_nodes.ids.push(c_id);
            adjacent_nodes.paths.push(c_edge);
            if (c_distance < game.restrictions.functions.nearest_neighbour[point_id]) {
                game.restrictions.functions.nearest_neighbour[point_id] = c_distance;
            }
            // Add the new point to the adjacent points list of neighbours too
            if (!this.graph.hasOwnProperty(c_id)) {
                // Initialise it just in case it hasn't been
                this.graph[c_id] = {"ids": [], "paths": []};
            }
            this.graph[c_id].ids.push(point_id);
            this.graph[c_id].paths.push(c_edge);
            if (!game.restrictions.functions.nearest_neighbour.hasOwnProperty(c_id) || c_distance < game.restrictions.functions.nearest_neighbour[c_id]) {
                game.restrictions.functions.nearest_neighbour[c_id] = c_distance;
            }
        }
        this.graph[point_id] = adjacent_nodes;
    }
    // Removes an item from the graph and updates it's neighbouring nodes
    game.restrictions.graph_model.removeNode = function(point_id) {
        Logger.log(LoggingType.NOTICE, "Removing node from graph tracking");
        // Loop through nodes neighbours and remove the node from their adjacent nodes list
        var c_entry, c_id, c_index, old_path;
        var flag_nearest_neighbour_update, c_n_path;
        for (var i = 0 ; i < this.graph[point_id].ids.length; i++) {
            // Get the adjacent node's list of adjacent nodes
            c_id = this.graph[point_id].ids[i];
            c_entry = this.graph[c_id];
            c_index = c_entry.ids.indexOf(parseInt(point_id));
            // Remove the point id from the entry of it's neighbour
            c_entry.ids.splice(c_index, 1);
            // Remove the path and update the shortest distance for neighbour
            old_path = c_entry.paths[c_index];
            flag_nearest_neighbour_update = Math.floor(old_path.length) == game.restrictions.functions.nearest_neighbour[c_id];
            old_path.remove();
            c_entry.paths.splice(c_index, 1);
            if (flag_nearest_neighbour_update) {
                game.restrictions.functions.nearest_neighbour[c_id] = Infinity;
                for (var j = 0; j < c_entry.paths.length; j++) {
                    c_n_path = c_entry.paths[j];
                    if (Math.floor(c_n_path.length) < game.restrictions.functions.nearest_neighbour[c_id]) {
                        game.restrictions.functions.nearest_neighbour[c_id] = Math.floor(c_n_path.length);
                    }
                }
            }
            this.graph[c_id] = c_entry;
        }
        // Remove the nodes own adjacent list from the graph
        delete this.graph[point_id];
    }
    game.restrictions.graph_model.check = function(point_location) {
        // Determine all neighbouring points
        var neighbouring_points = this.determineNeighbours(point_location);
        if (INTERSECTING_EDGE_CHECK && this.checkIfPointWillCreateIntersects(point_location, neighbouring_points)) {
            Logger.log(LoggingType.NOTICE, "Placing a point here would create intersections in graph");
            return false;
        }
        if (NUMBER_OF_VERTICES_CHECK && !this.checkVerticesAmountValid(neighbouring_points)){
            Logger.log(LoggingType.NOTICE, "Create a node with too many vertices");
            return false;
        }
        return true;
    }
    // Determines if a connection exists between two nodes
    // Optional variable of deleted_node that allows you to ignore a node in BFS
    game.restrictions.graph_model.findConnection = function(source, destination, deleted_node = -1) {
        // Determine the number of nodes in the graph
        var number_of_nodes = Object.keys(this.graph).length;

        // This keeps track of which nodes shoudl ahve their adjacent nodes checked first
        var queue = [];

        // An array to keep track of whether the ith node has been visited
        var visited = new Array(number_of_nodes).fill(false);

        // Source is obviously visted, and should be first to have it's adjacent nodes checked
        visited[source] = true;
        queue.push(source);

        // Implement the BFS Algorithm
        while (queue.length > 0) {
            // Get the node of the top of queue
            var u = queue.pop();
            // Foreach adjacent node
            for (var i = 0; i < this.graph[u].ids.length; i++) {
                // Get the adjacent node
                var current_node = this.graph[u].ids[i];
                // If it's the deleted node ignore it
                if (current_node == deleted_node) {
                    continue;
                }
                // If it's been visited already ignore it
                if (!visited[current_node]) {
                    // Otherwise note down that it's been visited and push to the queue to check out adjacent nodes
                    visited[current_node] = true;
                    queue.push(current_node);
                    // Return true if the destination's found
                    if (current_node == destination) {
                        return true;
                    }
                }
            }
        }
        // If you've looped through all connected points and not found the destination they're obviously not connected
        return false;
    }
    game.restrictions.graph_model.determineNeighbours = function(point_location) {
        var points_of_interest = game.determineSectionAndSurroundings(point_location);
        var neighbours = [];
        var c_id, c_position, c_distance;
        for (var i = 0; i < points_of_interest.length; i++) {
            c_id = points_of_interest[i];
            c_position = game.point_areas_list[c_id].position;
            c_point_distance = point_location.getDistance(c_position);
            if (c_point_distance < this.neighbour_distance) {
                neighbours.push(c_id);
            }
        }
        return neighbours;
    }
    game.restrictions.graph_model.checkIfPointWillCreateIntersects = function(point_location, neighbouring_points) {
        game.graph_layer.activate();
        // First determine set of new paths
        var paths_to_neighbours = this.createVirtualPaths(point_location, neighbouring_points);
        // Then for each of these new paths, check if they intersect with any of the neighbours paths
        // Loop through each point that's defined as a neighbour from the new position
        var paths_from_neighbours;
        for (var i = 0; i < neighbouring_points.length; i++) {
            neighbour_id = neighbouring_points[i];
            neighbour_point = game.point_areas_list[neighbour_id].position;
            // Determine all the paths that originate from this neighbour
            paths_from_neighbours = this.graph[neighbour_id].paths;
            // Loop through each of this neighbour's paths
            for (var j = 0; j < paths_from_neighbours.length; j++) {
                // For each of this neighbour's paths select one
                path_from_neighbour = paths_from_neighbours[j];
                // Then loop through each of the paths that would originate from the new position if it were implemented
                for (var k = 0; k < paths_to_neighbours.length; k++) {
                    // For each of these pairs of paths fetch any interesections that may occur between them
                    var intersections = path_from_neighbour.getIntersections(paths_to_neighbours[k]);
                    // Determine which neighbour this "new path" will end at
                    var neighbour_at_end_of_path = game.point_areas_list[neighbouring_points[k]].position;
                    // If there's an intersection
                    if (intersections.length == 1) {
                        // Check if the intersection is just occuring at a point (This will occur)
                        // Need to compare x and y of each object as otherwise they will not equal one another as they're not both points
                        // Check whether it's at the neighbouring id that's currently being examined i.e. neighbouring_points[i]
                        var intersection_at_point_being_examined = (intersections[0].point.x == neighbour_point.x && intersections[0].point.y == neighbour_point.y);
                        // Check whether it's at the neighbouring point that the path currently being looked at ends at i.e. neighbouring_points[k]
                        var intersection_at_neighbour_that_path_is_to = (intersections[0].point.x == neighbour_at_end_of_path.x && intersections[0].point.y == neighbour_at_end_of_path.y);
                        // If the point of intersection does not occur at either of the above points then this is an illegal interception
                        // Hence return true for causing intersections
                        if (!intersection_at_point_being_examined && !intersection_at_neighbour_that_path_is_to) {
                            return true;
                        }
                    } else if (intersections.length > 1) {
                        // If there is more than one intersection it is guaranteed that one of the intersections is illegal
                        // Therefore return true
                        return true;
                    }
                }
            }
        }
        // If all the above is satisfied this point is legal
        return false;
    }
    game.restrictions.graph_model.checkVerticesAmountValid = function(neighbouring_points) {
        // Determine if it has too many neighbouring points
        if (neighbouring_points.length > MAXIMUM_NUMBER_OF_VERTICES) {
            return false;
        }
        var neighbour_id;
        for (var i = 0; i < neighbouring_points.length; i++) {
            neighbour_id = neighbouring_points[i];
            if (this.graph[neighbour_id].ids.length >= MAXIMUM_NUMBER_OF_VERTICES) {
                return false;
            }
        }
        return true;
    }
    game.restrictions.graph_model.createVirtualPaths = function(point_location, destination_ids) {
        game.graph_layer.activate();
        var paths_to_neighbours = [];
        var neighbour_point;
        for (var i = 0; i < destination_ids.length; i++) {
            neighbour_point = game.point_areas_list[destination_ids[i]].position;
            paths_to_neighbours.push(new Path.Line(point_location, neighbour_point));
        }
        return paths_to_neighbours;
    }
    // ------------------------------------------------------------------------------------------
    // Implement grid based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.grid = {
        "density": {},
        "mode": GRID_MODE,
        "resolution": GRID_RESOLUTION,
        "tracking": {},
    }
    game.restrictions.grid.addPoint = function(point_location, point_id) {
        Logger.log(LoggingType.NOTICE, "Adding point to grid tracking")
        var grid_coordinates = this.determineGridCoordinates(point_location);
        if (!grid_coordinates) {
            Logger.log(LoggingType.ERROR, ["Failed to determine grid coordinates", "Point ID: "+point_id]);
            return false;
        }
        this.tracking[grid_coordinates.x][grid_coordinates.y].points.push(point_id);
        this.density.updateTracking(grid_coordinates, increase=true);
        return true;
    }
    game.restrictions.grid.removePoint = function(point_location, point_id) {
        Logger.log(LoggingType.NOTICE, "Removing point from grid tracking");
        var grid_coordinates = this.determineGridCoordinates(point_location);
        var c_entry = this.tracking[grid_coordinates.x][grid_coordinates.y].points;
        c_entry.splice(c_entry.indexOf(parseInt(point_id)), 1);
        this.tracking[grid_coordinates.x][grid_coordinates.y].points = c_entry;
        this.density.updateTracking(grid_coordinates, increase=false);
    }
    game.restrictions.grid.density.updateTracking = function(grid_coordinates, increase) {
        var new_density = game.restrictions.grid.tracking[grid_coordinates.x][grid_coordinates.y].points.length;
        var old_density = increase ? new_density - 1 : new_density + 1;
        if (!this.tracking.hasOwnProperty(new_density)) {
            this.tracking[new_density] = 0;
        }
        this.tracking[new_density]++;
        this.tracking[old_density]--;
    }
    game.restrictions.grid.check = function(point_location, removal=false) {
        var grid_coords = this.determineGridCoordinates(point_location);
        if (!grid_coords) {
            Logger.log(LoggingType.ERROR, ["Failed to fetch grid coordinates", "Point located at: "+point_location.x+", "+point_location.y]);
            return false;
        }
        if (!COMPLEX_DENSITY_ACTIVE) {
            var amount = this.tracking[grid_coords.x][grid_coords.y].points.length;
            return (amount < this.density.max && !removal) || (amount > this.density.min && removal);
        } else {
            return this.density.check(grid_coords, removal);
        }
    }
    game.restrictions.grid.density.check = function(grid_coords, removal) {
        // Determine new density
        var point_density_in_current_cell = game.restrictions.grid.tracking[grid_coords.x][grid_coords.y].points.length;
        var changed_density = removal ? point_density_in_current_cell - 1 : point_density_in_current_cell + 1;
        // Determine occupation space available for density
        var occupation_space = 0, occupation_amount = 0;
        var limitations = removal ? this.min : this.max;
        for (var density in limitations) {
            if ((density >= changed_density && !removal) || (density <= changed_density && removal)) {
                occupation_space += limitations[density];
            }
        }
        for (density in this.tracking) {
            if ((density >= changed_density && !removal) || (density <= changed_density && removal)) {
                occupation_amount += this.tracking[density];
            }
        }
        var occupation_percentage = Math.floor(occupation_amount / 1024 * 100);
        return occupation_percentage < occupation_space;
    }
    game.restrictions.grid.determineGridUnitCell = function(point_location) {
        var x = point_location.x;
        var y = point_location.y;
        // Coordinates of unit cell
        var x_prime, y_prime;
        var contained_paths = [];
        switch (this.mode) {
            case "SQUARE":
                x_prime = Math.floor(x/this.resolution);
                y_prime = Math.floor(y/this.resolution);
                contained_paths.push({"x": x_prime, "y": y_prime});
                break;
            case "HEXAGON":
                x_prime = Math.floor(x/(Math.sqrt(3)*this.resolution));
                y_prime = Math.floor(y/(3*this.resolution));
                // Push the 5 relevant cells
                // Also push x_prime, y_prime+1 first as that's the cell most likely to contain the point
                // Check which cells are valid and which aren't
                var x_prime_plus_one_within_bounds = x_prime + 1 < Object.keys(this.tracking).length;
                var y_prime_plus_one_within_bounds = y_prime + 1 < Object.keys(this.tracking[x_prime]).length;
                var y_prime_plus_two_within_bounds = y_prime + 2 < Object.keys(this.tracking[x_prime]).length;
                // Start with this cell as it's most likely to contain the location
                if (y_prime_plus_one_within_bounds) {
                    contained_paths.push({"x": x_prime, "y": 2 * y_prime + 1});
                }
                // These cells are the next two most likely
                if (y_prime_plus_two_within_bounds) {
                    contained_paths.push({"x": x_prime, "y": y_prime + 2});
                    if (x_prime_plus_one_within_bounds) {
                        contained_paths.push({"x": x_prime + 1, "y": y_prime + 2});
                    }
                }
                // These final two cells are least likely
                // This cell will always be within bounds
                contained_paths.push({"x": x_prime, "y": 2 * y_prime});
                if (x_prime_plus_one_within_bounds) {
                    contained_paths.push({"x": x_prime + 1, "y": 2 * y_prime});
                }
                break;
            case "TRIANGLE":
                x_prime = Math.floor(x/this.resolution);
                y_prime = Math.floor(y/((Math.sqrt(3)/2)*this.resolution));
                for (var i = 0; i <= 2; i++) {
                    contained_paths.push({"x": 2 * x_prime + i, "y": y_prime});
                }
                break;
            default:
                Logger.log(LoggingType.ERROR, ["Invalid grid type received", "Grid type: "+GRID_MODE]);
                window.location.reload();
        }
        return contained_paths;
    }
    game.restrictions.grid.determineGridCoordinates = function(point_location) {
        var notable_grid_cells = this.determineGridUnitCell(point_location);
        for (var i = 0; i < notable_grid_cells.length; i++) {
            var c_coords = notable_grid_cells[i];
            var c_grid_cell = this.tracking[c_coords.x][c_coords.y];
            if (c_grid_cell.path.contains(point_location)) {
                return c_coords;
            }
        }
        return false;
    }
    // Created a raster because otherwise massive lag was suffered due to re-rendering the grid each time
    game.restrictions.grid.initialiseGrid = function() {
        // Determine density model to use
        if (COMPLEX_DENSITY_ACTIVE) {
            this.density.max = MAX_NUMBER_PER_GRID_CELL_DISTRIBUTION;
            this.density.min = MIN_NUMBER_PER_GRID_CELL_DISTRIBUTION;
        } else {
            this.density.max = MAX_NUMBER_PER_GRID_CELL;
            this.density.min = MIN_NUMBER_PER_GRID_CELL;
        }
        // Activate appropriate layer
        game.grid_layer.activate();
        // Try to do a square grid
        this.render = new CompoundPath();
        this.render.strokeColor = "black";
        // Determine the ratio between resolution and, canvas height/width
        var resolution_ratio = game.canvas_size.height / this.resolution;
        switch (this.mode) {
            case "SQUARE":
                // Determine number of squares across width and height
                // Make sure to fill entire area with grid by using ceil
                var row_number = Math.ceil(resolution_ratio);
                var col_number = Math.ceil(resolution_ratio);
                for (var i = 0; i < col_number; i++) {
                    this.tracking[i] = {};
                    for (var j = 0; j < row_number; j++) {
                        var grid_element = new Path.Rectangle((i)*this.resolution, (j)*this.resolution, this.resolution, this.resolution);
                        this.render.addChild(grid_element);
                        this.tracking[i][j] = {"path": grid_element, "points": []};
                    }
                }
                break;
            case "HEXAGON":
                // There are two in every three squares
                var row_number = Math.ceil((resolution_ratio / 3) * 2) + 1;
                // There's 1 in every root(3) squares
                var col_number = Math.ceil(resolution_ratio / Math.sqrt(3)) + 1;
                // y-coordinate of centres begin at -resolution/2 then proceed to be 3/2 down each time
                // x-coordinate of centres begin at 0, then go in increments of resolution*root(3)
                // for x-coordinate alternating rows have a shift of resolution*root(3)/2
                for (var i = 0; i < col_number; i++) {
                    this.tracking[i] = {};
                    for (var j = 0; j < row_number; j++) {
                        var x_shift = 0;
                        if (j % 2 == 1) {
                            x_shift = 1/2;
                        }
                        var y = this.resolution * (j * (3/2) - 1/2);
                        var x = this.resolution * Math.sqrt(3) * (i + x_shift);
                        var grid_element = this.drawHexagon(x, y);
                        this.render.addChild(grid_element);
                        this.tracking[i][j] = {"path": grid_element, "points": []};
                    }
                }
                break;
            case "TRIANGLE":
                var triangle_width = this.resolution;
                var triangle_height = this.resolution * (Math.sqrt(3)/2);
                var row_number = Math.ceil(resolution_ratio * 2 / Math.sqrt(3));
                var col_number = Math.ceil(2 * resolution_ratio) + 1;
                for (var i = 0; i < col_number; i++) {
                    this.tracking[i] = {};
                    for (var j = 0; j < row_number; j++) {
                        var y = triangle_height * (j + (1/2));
                        var x = this.resolution * (i * (1/2));
                        var grid_element = this.drawTriangle(x, y, triangle_width, triangle_height)
                        if (i % 2 == j % 2) {
                            grid_element.rotate(180);
                        }
                        this.render.addChild(grid_element);
                        this.tracking[i][j] = {"path": grid_element, "points": []};
                    }
                }
                break;
            default:
                Logger.log(LoggingType.ERROR, ["Invalid grid type received", "Grid type:"+GRID_MODE]);
                window.location.reload();
        }
        this.cell_number = i*j;
        this.density.tracking = {"0": this.cell_number}
        var grid_raster = this.render.rasterize();
        this.render.visible = false;
        if (!RENDER_GRID) {
            grid_raster.visible = false;
        }
        view.draw();
    }
    game.restrictions.grid.drawTriangle = function(x, y, width, height) {
        var triangle = new Path({closed: true});
        triangle.strokeColor = "black";

        triangle.add(new Point(0, 0));
        triangle.add(new Point(width, 0));
        triangle.add(new Point(width/2, height));

        triangle.position = new Point(x, y);
        return triangle;
    }
    game.restrictions.grid.drawHexagon = function(x, y) {
        return this.drawPolygon(x, y, 6, Math.PI/2);
    }
    game.restrictions.grid.drawPolygon = function(x, y, n_vertices, initial_offset=0) {
        var poly = new Path({closed: true});
        poly.strokeColor = "black";

        var angle = ((2 * Math.PI) / n_vertices);

        for (var i = 0; i < n_vertices; i++) {
            poly.add(new Point(
                this.resolution * Math.cos(angle * i + initial_offset),
                this.resolution * Math.sin(angle * i + initial_offset)
            ));
        }

        poly.position = new Point(x, y);
        return poly;
    }
    // ------------------------------------------------------------------------------------------
    // Implement colour based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.colour = {};
    game.restrictions.colour.list = POINT_COLOURS;
    game.restrictions.colour.current = "#5EB1BF";
    game.restrictions.colour.current_index = 0;
    game.restrictions.colour.tracking = {};
    game.restrictions.colour.initialisePalette = function() {
        var selector;
        for (var i = 0; i < 8; i++) {
            selector = "#colour_select_"+i;
            $(selector).css("background-color", this.list[i]);
        }
        $("#colour_select_0").click(() => {game.restrictions.colour.update(0)});
        $("#colour_select_1").click(() => {game.restrictions.colour.update(1)});
        $("#colour_select_2").click(() => {game.restrictions.colour.update(2)});
        $("#colour_select_3").click(() => {game.restrictions.colour.update(3)});
        $("#colour_select_4").click(() => {game.restrictions.colour.update(4)});
        $("#colour_select_5").click(() => {game.restrictions.colour.update(5)});
        $("#colour_select_6").click(() => {game.restrictions.colour.update(6)});
        $("#colour_select_7").click(() => {game.restrictions.colour.update(7)});
        this.updatePalette();
    }
    game.restrictions.colour.update = function(new_index) {
        // Switch over the active colour
        this.current_index = new_index;
        this.current = this.list[this.current_index];
        // Indicate to the user which colour's being used
        this.updatePalette();
    }
    game.restrictions.colour.updatePalette = function() {
        $(".colour_select").css("border-color", "transparent");
        $("#colour_select_"+this.current_index).css("border-color", "#038ea1");
    }
    // ------------------------------------------------------------------------------------------
    // Implement statistic based restrictions
    // ------------------------------------------------------------------------------------------
    // ##########################################################################################
    // # One idea could be to make the mean have to fall in a certain area
    // ##########################################################################################
    game.restrictions.statistics = {
        "mean": {"x": 0, "y": 0},
        "s_dev": {"x": 0, "y": 0},
        "mean_restriction_active": MEAN_CHECK_ACTIVE 
    }
    game.restrictions.statistics.check = function(point_location) {
        if (!this.mean_restriction_active) {
            return true;
        }
        var new_x_mean = (this.mean.x * game.number_of_points_placed + point_location.x)/(game.number_of_points_placed + 1);
        var new_y_mean = (this.mean.y * game.number_of_points_placed + point_location.y)/(game.number_of_points_placed + 1);
        var new_mean = new Point(new_x_mean, new_y_mean);
        return this.mean_path.contains(new_mean);
    }
    game.restrictions.statistics.update = function() {
        var distribution = game.formatPointData();
        this.findMean(distribution);
        this.findStandardDeviation(distribution);
    }
    game.restrictions.statistics.findMean = function(distribution) {
        var sum_x = 0, sum_y = 0, n = distribution.x.length;
        for (var i = 0; i < n; i++) {
            sum_x += distribution.x[i];
            sum_y += distribution.y[i];
        }
        this.mean.x = sum_x/n;
        this.mean.y = sum_y/n;
    }
    game.restrictions.statistics.findStandardDeviation = function(distribution) {
        var sum_x = 0, sum_y = 0, n = distribution.x.length;
        for (var i = 0; i < n; i++) {
            sum_x += Math.pow((distribution.x[i]-this.mean.x), 2);
            sum_y += Math.pow((distribution.y[i]-this.mean.y), 2);
        }
        this.s_dev.x = Math.sqrt(sum_x/n);
        this.s_dev.y = Math.sqrt(sum_y/n);
    }
    game.restrictions.statistics.initialiseMeanRestriction = function() {
        var mean_path_location = new Point(MEAN_RESTRICTION_X, MEAN_RESTRICTION_Y);
        var mean_path_size = new Size(MEAN_PATH_SIZE, MEAN_PATH_SIZE)
        game.mean_path_layer.activate();
        this.mean_path = new Path.Rectangle(mean_path_location, mean_path_size);
        this.mean_path.fillColor = "purple";
        this.mean_path.visible = false;
    }
    // ------------------------------------------------------------------------------------------
    // Implement binary mask restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.mask = {};
    game.restrictions.mask.data = BINARY_MASK;
    game.restrictions.mask.check = function(location) {
        var x = Math.floor(location.x), y = Math.floor(location.y);
        return this.data[y][x] == 1;
    }
    // ------------------------------------------------------------------------------------------
    // Implement function based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.functions = {
        "pcf": {},
        "nearest_neighbour": {},
        "spherical_contact": {
            "random_points": {},
            "distances": {}
        }
    };
    game.restrictions.functions.initialisePCF = function() {
        for (var i = 0; i <= 1450; i++) {
            this.pcf[i] = 0;
        }
    }
    game.restrictions.functions.check = function(point_location) {
        if (PCF_CHECK_ACTIVE && !this.checkPCF(point_location)) {
            Logger.log(LoggingType.NOTICE, "Failed PCF check");
            return false;
        }
        return true;
    }
    game.restrictions.functions.addPoint = function(point_location, point_id) {
        // N.B. The Nearest Neighbour is handled through graph restrictions as it made sense to implement it there
        // Handle PCF
        var init_pcf = this.pcf;
        var fin_pcf  = this.modifyPCF(point_location, point_id, true, init_pcf);
        this.pcf = fin_pcf;
        // Handle Spherical Contact distribution
        var random_point = new Point(Math.random() * 1024, Math.random() * 1024);
        this.spherical_contact.random_points[point_id] = random_point;
        this.spherical_contact.distances[point_id] = Infinity;
        // Update all their nearest neighbours
        this.spherical_contact.updateNeighbours();
    }
    game.restrictions.functions.removePoint = function(point_location, point_id) {
        // N.B. The Nearest Neighbour is handled through graph restrictions as it made sense to implement it there
        // Handle PCF
        var init_pcf = this.pcf;
        var fin_pcf  = this.modifyPCF(point_location, point_id, false, init_pcf);
        this.pcf = fin_pcf;
        // Handle Spherical Contact distribution
        delete this.spherical_contact.random_points[point_id];
        delete this.spherical_contact.distances[point_id];
    }
    game.restrictions.functions.modifyPCF = function(point_location, point_id, adding_point, pcf) {
        var shift = adding_point ? 1 : -1;
        var c_point, c_distance;
        for (var id in game.point_images_list) {
            if (id == point_id) {
                continue;
            }
            c_point = game.point_images_list[id].position;
            c_distance = Math.floor(c_point.getDistance(point_location));
            pcf[c_distance] += shift;
        }
        return pcf;
    }
    game.restrictions.functions.normalisePCF = function(pcf, number_of_points) {
        // Determine point/px^2
        var point_density = 1 / Math.pow(1024, 2);
        if (number_of_points == 0) { 
            point_density = number_of_points / Math.pow(1024, 2);
        }
        var area, exp_points;
        for (var i = 0; i <= 1450; i++) {
            // Determine area of this annulus
            area = Math.PI * (Math.pow(i+1, 2) - Math.pow(i, 2));
            // Determine expected number of points
            exp_points = area * point_density;
            // Normalise pcf_value
            pcf[i] = Math.floor(pcf[i] / exp_points);
        }
        return pcf;
    }
    game.restrictions.functions.checkPCF = function(point_location) {
        var pcf = {};
        pcf = Object.assign(pcf, this.pcf);
        pcf = this.modifyPCF(point_location, -1, true, pcf);
        this.normalisePCF(pcf, game.number_of_points_placed + 1);
        var sums = {"short": 0, "medium": 0, "long": 0}
        var key = "long";
        for (var i = 0; i <= 1450; i++) {
            key = "long";
            if (i <= PCF_LIMITATIONS.short.range) {
                key = "short";
            } else if (i <= PCF_LIMITATIONS.medium.range) {
                key = "medium";
            }
            sums[key] += pcf[i];
        }

        var keys = Object.keys(PCF_LIMITATIONS);
        var average, range;
        for (var i = 0; i < keys.length; i++) {
            range = PCF_LIMITATIONS[keys[i]].range;
            if (i > 0) {
                range = PCF_LIMITATIONS[keys[i]].range - PCF_LIMITATIONS[keys[i-1]].range;
            }
            average = sums[keys[i]] / range;
            if (average < PCF_LIMITATIONS[keys[i]].low || average > PCF_LIMITATIONS[keys[i]].high) {
                return false;
            }
        }
        return true;
    }
    game.restrictions.functions.spherical_contact.updateNeighbours = function() {
        var c_point, c_neighbours, c_nearest, n_point;
        for (var id in this.random_points) {
            point = this.random_points[id];
            // Determine neighbours
            c_neighbours = game.determineSectionAndSurroundings(point);
            if (c_neighbours.length == 0) {
                for (var n_id in game.point_areas_list) {
                    n_point = game.point_areas_list[n_id];
                    if (n_point.position.getDistance(point) < this.distances[id]) {
                        this.distances[id] = Math.floor(n_point.position.getDistance(point));
                    }
                }
            } else {
                for (var i = 0; i < c_neighbours.length; i++) {
                    n_point = game.point_areas_list[c_neighbours[i]]
                    if (n_point.position.getDistance(point) < this.distances[id]) {
                        this.distances[id] = Math.floor(n_point.position.getDistance(point));
                    }
                }
            }
        }
    }
}

window.onload = function() {
    game.init();
}