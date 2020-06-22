// Define external constants
const accept_colour = new paper.Color(0.9, 1, 0.9, 1);
const reject_colour = new paper.Color(1, 0.9, 0.9, 1);

const GIVEN_SHAPE = false;
const NUMBER_WITHIN = 1;
const GRID_MODE = "SQUARE";
const GRID_RESOLUTION = 20;
const POINT_COLOURS = ["#5EB1BF", "#5E81BF", "#6C5EBF", "#9D5EBF", "#BF5EB1", "#BF5E80", "#BF6C5E", "#BF9D5E", "#B1BF5E", "#81BF5E", "#5EBF6C", "#5EBF9D"];

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
        this.grid_layer               = new Layer();
        this.grid_layer.opacity = 0.2;
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
    }
    game.checkValidity = function(point_location) {
        var distance_validity = game.restrictions.distance.checkDistance(point_location)
        return distance_validity;
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
        this.number_of_points_placed--;
    }
    game.renderPoint = function(point_location) {
        Logger.log(LoggingType.NOTICE, "Adding point");
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
        if (!game.checkValidity(point_location)) {
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
    game.restrictions.validatePointRemoval = function(point_id) {
        var point_path = game.point_areas_list[point_id];
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
    game.restrictions.distance.checkDistance = function(point_location) {
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
        var points_of_interest = game.determineSectionAndSurroundings(point_location);
        var c_id, c_point_position, c_point_distance;
        var adjacent_nodes = {"ids": [], "distances": []};
        for (var i = 0; i < points_of_interest.length; i++) {
            c_id = points_of_interest[i];
            c_point_position = game.point_areas_list[c_id].position;
            c_point_distance = point_location.getDistance(c_point_position);
            // Determine whether the current node is within a distance that defines it as a neighbouring node
            if (c_point_distance < this.neighbour_distance) {
                // If so add it to the points list of adjacent nodes
                adjacent_nodes.ids.push(c_id);
                adjacent_nodes.distances.push(c_point_distance);
                // Add the new point to the adjacent points list of neighbours too
                if (!this.graph.hasOwnProperty(c_id)) {
                    // Initialise adjacent node array for a node incase it doens't already have one
                    this.graph[c_id] = {"ids": [], "distances": []};
                }
                this.graph[c_id].ids.push(point_id);
                this.graph[c_id].distances.push(c_point_distance)
            }
        }
        this.graph[point_id] = adjacent_nodes;
    }
    // Removes an item from the graph and updates it's neighbouring nodes
    game.restrictions.graph_model.removeNode = function(point_id) {
        Logger.log(LoggingType.NOTICE, "Removing node from graph tracking");
        // Loop through nodes neighbours and remove the node from their adjacent nodes list
        var c_entry, c_id, c_index;
        for (var i = 0 ; i < this.graph[point_id].ids.length; i++) {
            // Get the adjacent node's list of adjacent nodes
            c_id = this.graph[point_id].ids[i];
            c_entry = this.graph[c_id];
            c_index = c_entry.ids.indexOf(parseInt(point_id));
            // Remove the point id from the entry of it's neighbour
            c_entry.ids.splice(c_index, 1);
            c_entry.distances.splice(c_index, 1);
            this.graph[c_id] = c_entry;
        }
        // Remove the nodes own adjacent list from the graph
        delete this.graph[point_id];
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

    // ------------------------------------------------------------------------------------------
    // Implement grid based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.grid = {
        "mode": GRID_MODE,
        "resolution": GRID_RESOLUTION
    }
    game.restrictions.grid.tracking = {}
    game.restrictions.grid.addPoint = function(point_location, point_id) {
        Logger.log(LoggingType.NOTICE, "Adding point to grid tracking")
        var grid_coordinates = this.determineGridCoordinates(point_location);
        if (!grid_coordinates) {
            Logger.log(LoggingType.ERROR, ["Failed to determine grid coordinates", "Point ID: "+point_id]);
            return false;
        }
        this.tracking[grid_coordinates.x][grid_coordinates.y].points.push(point_id);
        return true;
    }
    game.restrictions.grid.removePoint = function(point_location, point_id) {
        Logger.log(LoggingType.NOTICE, "Removing point from grid tracking");
        var grid_coordinates = this.determineGridCoordinates(point_location);
        var c_entry = this.tracking[grid_coordinates.x][grid_coordinates.y].points;
        c_entry.splice(c_entry.indexOf(parseInt(point_id)), 1);
        this.tracking[grid_coordinates.x][grid_coordinates.y].points = c_entry;
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
                        if (RENDER_GRID) {
                            var grid_element = new Path.Rectangle((i)*this.resolution, (j)*this.resolution, this.resolution, this.resolution);
                            this.render.addChild(grid_element);
                        }
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
                        if (RENDER_GRID) {
                            var x_shift = 0;
                            if (j % 2 == 1) {
                                x_shift = 1/2;
                            }
                            var y = this.resolution * (j * (3/2) - 1/2);
                            var x = this.resolution * Math.sqrt(3) * (i + x_shift);
                            var grid_element = this.drawHexagon(x, y);
                            this.render.addChild(grid_element);
                        }
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
                        if (RENDER_GRID) {
                            var y = triangle_height * (j + (1/2));
                            var x = this.resolution * (i * (1/2));
                            var grid_element = this.drawTriangle(x, y, triangle_width, triangle_height)
                            if (i % 2 == j % 2) {
                                grid_element.rotate(180);
                            }
                            this.render.addChild(grid_element);
                        }
                        this.tracking[i][j] = {"path": grid_element, "points": []};
                    }
                }
                break;
            default:
                Logger.log(LoggingType.ERROR, ["Invalid grid type received", "Grid type:"+GRID_MODE]);
                window.location.reload();
        }
        var grid_raster = this.render.rasterize();
        this.render.visible = false;
        view.draw();
    }
    // ------------------------------------------------------------------------------------------
    // Implement colour based restrictions
    // ------------------------------------------------------------------------------------------
    game.restrictions.colour = {};
    game.restrictions.colour.list = POINT_COLOURS;
    game.restrictions.colour.current = "#5EB1BF";
    game.restrictions.colour.current_index = 0;
    game.restrictions.colour.tracking = {};
    game.restrictions.colour.renderColourPallete = function() {
        
    }
}

window.onload = function() {
    game.init();
}