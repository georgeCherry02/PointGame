// ##########################################################################################
// # Consider adding a function limitation indicator of the values
// # this could be at the top of the page and be constantly changing...
// # Disadvangtage is navigating DOM is super slow so may not do that?
// # Will try to see if it's happy
// ##########################################################################################
// Define external constants
const accept_colour = new paper.Color(0.9, 1, 0.9, 1);
const reject_colour = new paper.Color(1, 0.9, 0.9, 1);

// Restrictions outline
// ##########################################################################################
// # Consider rewriting this to represent a neighbour number
// ##########################################################################################
// const NUMBER_WITHIN = 1;
// const RENDER_GRID = false;
// const GRID_MODE = "SQUARE";
// const GRID_RESOLUTION = 32;
// const MAX_NUMBER_PER_GRID_CELL_DISTRIBUTION = {"50": 100};
// const MIN_NUMBER_PER_GRID_CELL_DISTRIBUTION = {"0": 100};
// const MEAN_LIMITATIONS = {"x": {"min": 0, "max": 1024}, "y": {"min": 0, "max": 1024}};
// const STDEV_LIMITATIONS = {"x": {"min": 0, "max": Infinity}, "y": {"min": 0, "max": Infinity}};
// const PPMCC_LIMITATIONS = {"min": -1, "max": 1};
// const NEAREST_NEIGHBOUR_LIMITATIONS = {"short": {"range": 32, "low": 0, "high": Infinity}, "medium": {"range": 128, "low": 0, "high": Infinity}, "long": {"range": 1450, "low": 0, "high": Infinity}};
// const PCF_LIMITATIONS = {"short": {"range": 32, "low": 0, "high": Infinity}, "medium": {"range": 128, "low": 0, "high": Infinity}, "long": {"range": 1450, "low": 0, "high": Infinity}};
// const SPHERICAL_CONTACT_LIMITATIONS = {"short": {"range": 32, "low": 0, "high": Infinity}, "medium": {"range": 128, "low": 0, "high": Infinity}, "long": {"range": 1450, "low": 0, "high": Infinity}};
// const J_FUNCTION_LIMITATIONS = {"short": {"range": 32, "low": 0, "high": Infinity}, "medium": {"range": 128, "low": 0, "high": Infinity}, "long": {"range": 1450, "low": 0, "high": Infinity}};
// const NEIGHBOURING_DISTANCE = 10;
// const DEGREE_OF_VERTICES_LIMITATIONS = 5;


with (paper) {
    var game = {};
    // Note this just increments when points are placed and doesn't decrement when points are removed
    game.number_of_points_placed = 0;
    game.total_number_of_points_placed = 0;
    
    // Define list of points
    game.point_area_display_list = {};

    // Define which mode the game's in
    game.chaining = GRAPH_CHECK_ACTIVE;

    // Divide canvas into quadrants
    // 0 1 ... 7
    // 8 ...
    // 16 ...
    // .
    // .
    // 56 ... 63
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
        this.determineCanvasDimensions();
        this.colour.generatePicker();
        this.setPanelPositions();
        this.canvas = $("#game_canvas");
        setup(this.canvas[0]);

        this.base_layer               = new Layer();
        this.point_area_display_layer = new Layer();
        this.graph_layer              = new Layer();
        this.graph_layer.opacity      = 0.7;
        this.grid_layer               = new Layer();
        this.grid_layer.opacity       = 0.4;
        this.mouse_track_layer        = new Layer();
    
        // Initialise custom mouse
        this.mouse_track_layer.opacity = 0.5;
        this.mouse_validity_indicator = new Path.Circle({
            center: new Point(-15, -15),
            radius: 10
        });
        this.mouse_marker = new Path.Circle({
            center: new Point(-2, -2),
            radius: 2
        });
    
        // Initialise game_tool
        this.point_tool = new Tool();
        this.point_tool.onMouseDown = function(event) {
            game.last_used_section_requires_update = true;
            if (game.restrictions.checkPlacementValidity(event.point)) {
                // Draw point onto canvas
                game.renderPoint(event.point);
            } else {
                // Fetch closest point
                var nearest_point_id = game.findNearestPoint(event.point);
                // Determine if there was a nearest point (It can be the case that there was only one point placed)
                if (nearest_point_id == -1) {
                    event.stopPropagation();
                    return;
                }
                var nearest_point = game.point_area_display_list[nearest_point_id];
                // Check that the location's within the points minimum radius
                if (event.point.getDistance(nearest_point.position) < MINIMUM_RADIUS) {
                    // Check that it's valid to remove this point
                    if (game.restrictions.validatePointRemoval(nearest_point_id)) {
                        game.removePoint(nearest_point_id);
                    }
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

        if (GRID_CHECK_ACTIVE) {
            this.restrictions.grid.initialise();
        }
        if (NOISE_ACTIVE) {
            this.restrictions.noise.initialise();
        }
        this.populateRestrictionsModal();
    }
    game.resize = function() {
        this.clear();
        this.init();
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
    game.populateRestrictionsModal =  function() {
        let html = "";
        if (GRAPH_CHECK_ACTIVE) {
            html += "<p><b>Graph Active</b></p>";
            html += "<p>Distance within which points are neighbouring nodes: "+NEIGHBOURING_DISTANCE+"</p>";
            if (INTERSECTING_EDGE_CHECK_ACTIVE) html += "<p>Not allowed intersecting edges</p>";
            if (DEGREE_OF_VERTICES_CHECK_ACTIVE) html += "<p>Maximum number of neighbours: "+DEGREE_OF_VERTICES_LIMITATIONS+"</p>";
        }
        if (GRID_CHECK_ACTIVE) {
            html += "<p><b>Grid Check Active</b></p>";
            html += "<p>Maximum points per grid cell: "+game.restrictions.grid.max+"</p>";
            if (game.restrictions.grid.min > 0) html += "<p>Minimum points per grid cell: "+game.restrictions.grid.min+"</p>";
        }
        if (NOISE_ACTIVE) {
            html += "<p><b>Noise Active</b></p>";
            html += "<p>"+NOISE_AMOUNT+" immovable noise points added.</p>";
        }
        if (html.length == 0) html = "<p><b>None!</b></p>";
        document.getElementById("restriction_summary_container").innerHTML = html;
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
    game.clear = function() {
        // Remove every single point from all tracking lists and render
        for (var point_id in this.point_area_display_list) {
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
    game.determineSectionAndSurroundings = function(point_location, radius = 1) {
        var i = Math.floor(point_location.x / this.canvas_sections_size);
        var j = Math.floor(point_location.y / this.canvas_sections_size);
        var section_id = this.determineSectionID(point_location);
        // Trying to optimise a bit by checking if we've already formed this array
        if (!this.last_used_section_requires_update && section_id == this.last_used_section_and_surroundings_id && radius == this.last_used_section_and_surroundings_radius) {
            return this.last_used_section_and_surroundings;
        }
        this.last_used_section_and_surroundings_id = section_id;
        this.last_used_section_requires_update = false;
        var surrounding_ids = [];
        for (var section_i = i - radius; section_i <= i + radius; section_i++) {
            if (section_i >= 0 && section_i < 8) {
                for (var section_j = j - radius; section_j <= j + radius; section_j++) {
                    if (section_j >= 0 && section_j < 8) {
                        var section_number = 8 * section_j + section_i;
                        Array.prototype.push.apply(surrounding_ids, this.canvas_sections[section_number]);
                    }
                }       
            }
        }
        this.last_used_section_and_surroundings_radius = radius;
        this.last_used_section_and_surroundings = surrounding_ids;
        return surrounding_ids;
    }
    game.determineSectionID = function(point_location) {
        var i = Math.floor(point_location.x / this.canvas_sections_size);
        var j = Math.floor(point_location.y / this.canvas_sections_size);
        return 8*j + i;
    }
    game.findNearestPoints = function(point_location, point_id=-1, excluded_points = []) {
        // If point_id is set then should be able to find it through graph
        if (game.restrictions.graph_model.graph.hasOwnProperty(point_id)) {
            // Check if it's not a lone node on graph
            if (game.restrictions.graph_model.graph[point_id].length > 0) {
                var graph_result = game.restrictions.graph_model.graph[point_id].ids;
                if (graph_result.length > 0) {
                    var exclusion_result = graph_result.filter(
                        function(e) {
                            return this.indexOf(e) < 0;
                        },
                        excluded_points
                    );
                    if (exclusion_result.length != 0) {
                        return exclusion_result;
                    }
                }
            }
        } 

        // If not see if there are any near neighbours
        search_radius = 0;
        near_points = [];
        // For each time nothing's turned up expand search radius
        while (search_radius < 8 && (near_points.length == 0 || (near_points.length == 1 && near_points[0] == point_id))) {
            near_points = game.determineSectionAndSurroundings(point_location, search_radius)
            near_points = near_points.filter(
                function(e) {
                    return this.indexOf(e) < 0;
                },
                excluded_points 
            );
            search_radius++;
        }
        return near_points;
    }
    game.findNearestPoint = function(point_location, point_id=-1, excluded_points=[]) {
        var neighbours = this.findNearestPoints(point_location, point_id, excluded_points);
        if (neighbours.length == 0) {
            return -1;
        }
        var nearest_id = -1, neighbour_id;
        var shortest_distance = Infinity, neighbour_distance;
        for (var i = 0; i < neighbours.length; i++) {
            neighbour_id = neighbours[i];
            if (neighbour_id == point_id) {
                continue;
            }
            neighbour_distance = game.point_area_display_list[neighbour_id].position.getDistance(point_location);
            if (neighbour_distance < shortest_distance) {
                nearest_id = neighbour_id;
                shortest_distance = neighbour_distance;
            }
        }
        return nearest_id;
    }
    game.formatPointData = function() {
        let result = {};
        Logger.log(LoggingType.NOTICE, "Formatting point data");
        let c_point, col;
        for (let id in this.point_area_display_list) {
            c_point = this.point_area_display_list[id];
            col = c_point.fillColor._canvasStyle;
            if (!result.hasOwnProperty(col)) {
                result[col] = {
                    components: c_point.fillColor._components,
                    x: [],
                    y: []
                };
            }
            result[col].x.push(Math.floor(c_point.position.x));
            result[col].y.push(Math.floor(c_point.position.y));
        }
        return result;
    }
    game.removePoint = function(point_id) {
        Logger.log(LoggingType.NOTICE, "Removing point "+point_id);
        // Get path of point from total list
        var point_path = this.point_area_display_list[point_id];
        // Remove the point from the graph tracking 
        this.restrictions.graph_model.removeNode(point_id);
        // Remove the point from the grid tracking
        if (GRID_CHECK_ACTIVE) {
            this.restrictions.grid.removePoint(point_path.position, point_id);
        }
        // Determine the section we're dealing with
        var section_id = this.determineSectionID(point_path.position);
        // Remove point_area path from section
        var list_of_ids = this.canvas_sections[section_id];
        list_of_ids.splice(list_of_ids.indexOf(parseInt(point_id)), 1);
        this.canvas_sections[section_id] = list_of_ids;
        // Remove point_area_display from tracking list and rendering
        this.point_area_display_layer.activate();
        var point_area_display = this.point_area_display_list[point_id];
        point_area_display.remove();
        delete this.point_area_display_list[point_id];

        // Decrease point tally
        this.number_of_points_placed--;
        // Remind determineSectionsAndSurroundings to update
        game.last_used_section_requires_update = true;
    }
    game.renderPoint = function(point_location, noise=false) {
        Logger.log(LoggingType.NOTICE, "Adding point");
        // Update the neighbours map
        this.restrictions.graph_model.addNode(point_location, this.total_number_of_points_placed);
        // Update the grid map
        if (GRID_CHECK_ACTIVE) {
            if (!this.restrictions.grid.addPoint(point_location, this.total_number_of_points_placed)) {
                // If the grid add failed remove graph node
                Logger.log(LoggingType.ERROR, ["Failed to render point", "Removing node from graph tracking"]);
                if (GRAPH_CHECK_ACTIVE) {
                    this.restrictions.graph_model.removeNode(this.total_number_of_points_placed);
                }
                return;
            }
        }
        
        // Push to index tracking quadrants
        this.determineSection(point_location).push(this.total_number_of_points_placed);

        // Activate appropriate layer
        this.point_area_display_layer.activate();
        // Define the point's area appearance
        var point_area = new Path.Circle({
            center: point_location,
            radius: MINIMUM_RADIUS
        });
        point_area.fillColor = noise ? "#424347" : this.colour.current;
        // If noise mark as such
        point_area.noise = noise;
        // Push to own list to keep track of each point
        this.point_area_display_list[this.total_number_of_points_placed] = point_area;

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
        // Verify grid limit
        if (!game.restrictions.grid.checkMinimums()) {
            alert("Insufficient points to satisfy grid minimums");
            return;
        }
        var process = "submitPoints";
        var data = {};
        data.freeplay = false;
        data.canvas_size = this.canvas_size.width;
        data.point_pattern = this.formatPointData();
        let shape = document.getElementById("shape_input").value;
        let name = document.getElementById("name_input").value;
        let name_pattern = /^[a-zA-Z 0-9!]{1,30}$/
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
            minimum_radius: MINIMUM_RADIUS,
            number_of_neighbours: NUMBER_OF_CLOSE_NEIGHBOURS,
            graph_check: {
                active: GRAPH_CHECK_ACTIVE
            },
            grid_check: {
                active: GRID_CHECK_ACTIVE
            }
        }
        if (GRAPH_CHECK_ACTIVE) {
            data.restrictions.graph_check.render = GRAPH_RENDER;
            data.restrictions.graph_check.intersecting_edges = !INTERSECTING_EDGE_CHECK_ACTIVE;
            data.restrictions.graph_check.neighbour_distance = NEIGHBOURING_DISTANCE;
            data.restrictions.graph_check.degree_of_vertices = {
                active: DEGREE_OF_VERTICES_CHECK_ACTIVE
            }
            if (DEGREE_OF_VERTICES_CHECK_ACTIVE) {
                data.restrictions.graph_check.degree_of_vertices.value = DEGREE_OF_VERTICES_LIMITATIONS;
            }
        }
        if (GRID_CHECK_ACTIVE) {
            data.restrictions.grid_check.render = GRID_RENDER;
            data.restrictions.grid_check.mode = GRID_MODE;
            data.restrictions.grid_check.resolution = GRID_DIMENSIONS;
            data.restrictions.grid_check.density_maximums = MAX_NUMBER_PER_GRID_CELL_DISTRIBUTION;
            data.restrictions.grid_check.density_minimums = MIN_NUMBER_PER_GRID_CELL_DISTRIBUTION;
        }
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
                    window.location.href = "review.php";
                } else {
                    Logger.log(LoggingType.ERROR, ["Error Code: "+response.error_code, "Message: "+response.error_message]);
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
    // Restrictions functionality
    game.restrictions = {}
    // ------------------------------------------------------------------------------------------
    // Implement general restriction functions
    // ------------------------------------------------------------------------------------------
    game.restrictions.checkPlacementValidity = function(point_location) {
        // Make sure point_location is valid
        if (point_location.x < 0 || point_location.x > game.canvas_size.width || point_location.y < 0 || point_location.y > game.canvas_size.height) {
            Logger.log(LoggingType.NOTICE, "Outside of canvas");
            return false;
        }
        // To optimise try to check in order that will require least operations first
        if (MASK_CHECK_ACTIVE && !this.mask.check(point_location)) {
            Logger.log(LoggingType.NOTICE, "Outside binary mask");
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
        if (GRAPH_CHECK_ACTIVE && !this.graph_model.check(point_location)) {
            Logger.log(LoggingType.NOTICE, "Failed Graph checks");
            return false;
        }
        return true;
    }
    game.restrictions.validatePointRemoval = function(point_id) {
        Logger.log(LoggingType.NOTICE, "Validating point removal");
        var point_path = game.point_area_display_list[point_id];
        if (point_path.noise) {
            Logger.log(LoggingType.NOTICE, "Not able to remove noise");
            return false;
        }
        if (GRID_CHECK_ACTIVE && !this.grid.check(point_path.position, removal=true)) {
            Logger.log(LoggingType.NOTICE, "Failed grid density check");
            return false;
        }
        // Graph no longer limits removal
        return true;
    }
    // ------------------------------------------------------------------------------------------
    // Implement distance based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.distance = {}
    game.restrictions.distance.check = function(point_location) {
        // Check if there are any points already existing, otherwise this questions irrelevant
        if (Object.keys(game.point_area_display_list).length === 0) {
            return true;
        }

        // Check which quadrant the mouse is in
        var points_of_interest = game.determineSectionAndSurroundings(point_location);
        if (NEIGHBOURING_DISTANCE > game.canvas_sections_size) {
            // Need to determine a search radius, otherwise game.determineSectionAndSurroundings may 
            // miss points actually within max radius
            var search_radius = Math.floor(NEIGHBOURING_DISTANCE / game.canvas_sections_size);
            points_of_interest = game.determineSectionAndSurroundings(point_location, search_radius);
        }

        // Check the minimum distance is okay...
        return this.checkMinimumDistance(point_location, points_of_interest);
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
            let distance = game.point_area_display_list[point_ids[i]].position.getDistance(point_location);
            if (distance < NEIGHBOURING_DISTANCE) {
                current_number_within_range++;
                // Check if the point's within range of enough other points to be placed
                if (current_number_within_range >= NUMBER_OF_CLOSE_NEIGHBOURS) {
                    return true;
                }
            }
        }
        // Check if there are less points than required, and in which case return whether all are within range
        if (game.number_of_points_placed < NUMBER_OF_CLOSE_NEIGHBOURS) {
            return current_number_within_range === game.number_of_points_placed;
        }
        return false;
    }
    // ------------------------------------------------------------------------------------------
    // Implement graph based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.graph_model = {}
    // Initialise neighbour distance
    if (game.chaining) {
        game.restrictions.graph_model.neighbour_distance = NEIGHBOURING_DISTANCE;
    } else {
        // Allows you not to set NEIGHBOURING_DISTANCE if there's a min+max radius
        game.restrictions.graph_model.neighbour_distance = MINIMUM_RADIUS + NEIGHBOURING_DISTANCE;
    }
    // Initialise neigbouring map
    game.restrictions.graph_model.graph = {}
    // Adds an item to the graph and updates it's neighbouring nodes
    game.restrictions.graph_model.addNode = function(point_location, point_id) {
        Logger.log(LoggingType.NOTICE, "Adding node to graph tracking");
        // Activate appropriate layer
        var neighbouring_points = this.determineNeighbours(point_location);
        game.graph_layer.activate();
        var c_id, c_point, c_edge;
        var adjacent_nodes = {"ids": [], "paths": []};
        for (var i = 0; i < neighbouring_points.length; i++) {
            c_id = neighbouring_points[i];
            c_point = game.point_area_display_list[c_id];
            c_edge = new Path.Line(point_location, c_point.position);
            if (GRAPH_CHECK_ACTIVE && GRAPH_RENDER) {
                c_edge.strokeColor = "black";
            }
            adjacent_nodes.ids.push(c_id);
            adjacent_nodes.paths.push(c_edge);
            // Add the new point to the adjacent points list of neighbours too
            if (!this.graph.hasOwnProperty(c_id)) {
                // Initialise it just in case it hasn't been
                this.graph[c_id] = {"ids": [], "paths": []};
            }
            this.graph[c_id].ids.push(point_id);
            this.graph[c_id].paths.push(c_edge);
        }
        this.graph[point_id] = adjacent_nodes;
    }
    // Removes an item from the graph and updates it's neighbouring nodes
    game.restrictions.graph_model.removeNode = function(point_id) {
        Logger.log(LoggingType.NOTICE, "Removing node from graph tracking");
        // Loop through nodes neighbours and remove the node from their adjacent nodes list
        var c_entry, c_id, c_index, old_path;
        for (var i = 0 ; i < this.graph[point_id].ids.length; i++) {
            // Get the adjacent node's list of adjacent nodes
            c_id = this.graph[point_id].ids[i];
            c_entry = this.graph[c_id];
            c_index = c_entry.ids.indexOf(parseInt(point_id));
            // Remove the point id from the entry of it's neighbour
            c_entry.ids.splice(c_index, 1);
            // Remove the path and update the shortest distance for neighbour
            old_path = c_entry.paths[c_index];
            old_path.remove();
            c_entry.paths.splice(c_index, 1);
            this.graph[c_id] = c_entry;
        }
        // Remove the nodes own adjacent list from the graph
        delete this.graph[point_id];
    }
    game.restrictions.graph_model.check = function(point_location) {
        // Determine all neighbouring points
        var neighbouring_points = this.determineNeighbours(point_location);
        if (INTERSECTING_EDGE_CHECK_ACTIVE && this.checkIfPointWillCreateIntersects(point_location, neighbouring_points)) {
            Logger.log(LoggingType.NOTICE, "Placing a point here would create intersections in graph");
            return false;
        }
        if (DEGREE_OF_VERTICES_CHECK_ACTIVE && !this.checkVerticesAmountValid(neighbouring_points)){
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
    // ##########################################################################################
    // # Minor issue of neighbouring distance going greater than canvas_dim / 8;
    // # However I really doubt that'll happen, worth noting as an exception though
    // ##########################################################################################
    game.restrictions.graph_model.determineNeighbours = function(point_location) {
        var points_of_interest = game.determineSectionAndSurroundings(point_location);
        var neighbours = [];
        var c_id, c_position;
        for (var i = 0; i < points_of_interest.length; i++) {
            c_id = points_of_interest[i];
            c_position = game.point_area_display_list[c_id].position;
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
            neighbour_point = game.point_area_display_list[neighbour_id].position;
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
                    var neighbour_at_end_of_path = game.point_area_display_list[neighbouring_points[k]].position;
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
        if (neighbouring_points.length > DEGREE_OF_VERTICES_LIMITATIONS) {
            return false;
        }
        let neighbour_id;
        for (let i = 0; i < neighbouring_points.length; i++) {
            neighbour_id = neighbouring_points[i];
            if (this.graph[neighbour_id].ids.length >= DEGREE_OF_VERTICES_LIMITATIONS) {
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
            neighbour_point = game.point_area_display_list[destination_ids[i]].position;
            paths_to_neighbours.push(new Path.Line(point_location, neighbour_point));
        }
        return paths_to_neighbours;
    }
    // ------------------------------------------------------------------------------------------
    // Implement grid based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.grid = {
        "density": {},
        "tracking": {},
        "cell_number": 0
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
        return this.density.check(grid_coords, removal);
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
        // Determine occupation amount in units of number of cells
        for (density in this.tracking) {
            if ((density >= changed_density && !removal) || (density <= changed_density && removal)) {
                occupation_amount += this.tracking[density];
            }
        }
        // Determine occupation percentage in units of percentage of grid
        var occupation_percentage = Math.floor(occupation_amount / game.restrictions.grid.cell_number * 100);
        return occupation_percentage < occupation_space;
    }
    game.restrictions.grid.checkMinimums = function() {
        console.log("Check!");
        for (let x in this.tracking) {
            for (let y in this.tracking[x]) {
                let cell = this.tracking[x][y];
                console.log(cell);
                if (cell.points.length < this.min) return false;
            }
        }
        return true;
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
                y_prime = Math.floor(y/(3/2*this.resolution));
                // Push the 5 relevant cells
                // Also push x_prime, y_prime+1 first as that's the cell most likely to contain the point
                // Check which cells are valid and which aren't
                var x_prime_plus_one_within_bounds = x_prime + 1 < Object.keys(this.tracking).length && this.tracking[x_prime+1].hasOwnProperty(y_prime);
                var y_prime_plus_one_within_bounds = this.tracking[x_prime].hasOwnProperty(y_prime + 1);
                var x_y_prime_plus_one_within_bounds = x_prime + 1 < Object.keys(this.tracking).length && this.tracking[x_prime+1].hasOwnProperty(y_prime+1);
                // Start with this cell as it's most likely to contain the location
                contained_paths.push({"x": x_prime, "y": y_prime});
                if (x_prime_plus_one_within_bounds) contained_paths.push({"x": x_prime+1, "y": y_prime});
                if (y_prime_plus_one_within_bounds) contained_paths.push({"x": x_prime, "y": y_prime+1})
                if (x_y_prime_plus_one_within_bounds) contained_paths.push({"x": x_prime+1, "y": y_prime+1});
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
        console.log("Actual failure");
        return false;
    }
    // Created a raster because otherwise massive lag was suffered due to re-rendering the grid each time
    game.restrictions.grid.initialise = function() {
        // Determine density model to use
        this.mode = GRID_MODE;
        this.grid_amount = GRID_DIMENSIONS;
        this.resolution = game.canvas_size.width / GRID_DIMENSIONS;
        // This is only because of limitations now imposed
        // I.e. restrictions are less complex hence this is a shortcut
        this.max = Object.keys(MAX_NUMBER_PER_GRID_CELL_DISTRIBUTION)[0];
        this.min = Object.keys(MIN_NUMBER_PER_GRID_CELL_DISTRIBUTION)[0];
        this.density.max = MAX_NUMBER_PER_GRID_CELL_DISTRIBUTION;
        this.density.min = MIN_NUMBER_PER_GRID_CELL_DISTRIBUTION;
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
                        if (x - this.resolution*Math.sqrt(3)/2 > game.canvas_size.width) continue;
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
        if (!GRID_RENDER) {
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
    game.colour = {};
    game.colour.current = "#000000"
    game.colour.update = function() {
        let colour = document.getElementById("point_colour_input").value;
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
    // ------------------------------------------------------------------------------------------
    // Implement binary mask restrictions
    // ------------------------------------------------------------------------------------------
    // game.restrictions.mask = {};
    // game.restrictions.mask.data = BINARY_MASK;
    // game.restrictions.mask.check = function(location) {
    //     var x = Math.floor(location.x), y = Math.floor(location.y);
    //     return this.data[y][x] == 1;
    // }
    // ------------------------------------------------------------------------------------------
    // Implement binary mask restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.noise = {};
    game.restrictions.noise.initialise = function() {
        this.amount = NOISE_AMOUNT;
        for (let i = 0; i < NOISE_AMOUNT; i++) {
            let x = Math.random() * game.canvas_size.width;
            let y = Math.random() * game.canvas_size.height;
            let point = new Point(x, y);
            if (game.restrictions.checkPlacementValidity(point)) {
                game.renderPoint(point, true)
            } else {
                i--;
            }
        }
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
window.onresize = function() {
    game.resize();
}