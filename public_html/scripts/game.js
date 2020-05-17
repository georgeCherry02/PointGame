// Define properties of canvas
var game_canvas = $("#game_canvas");
var origin = new paper.Point(0, 0);
var canvas_size = new paper.Size(1024, 1024);

// Define colours used
const accept_colour = new paper.Color(0.9, 1, 0.9, 1);
const reject_colour = new paper.Color(1, 0.9, 0.9, 1);
const point_colour = new paper.Color(0.9, 0.9, 1, 1);

// Define list of points
var point_images_list = [];
var point_areas_list = [];

// Define global paths
var accept_point_region;
var canvas_region;

window.onload = function() {
    with(paper) {
        Logger.log(LoggingType.STATUS, "Initialising canvas");
        setup(game_canvas[0]);

        // Define layers
        var base_layer = new Layer();
        var point_areas_layer = new Layer();
        var points_layer = new Layer();
        var mouse_track_layer = new Layer();
        mouse_track_layer.opacity = 0.5;

        // Define acceptance region and the canvas in a shape
        base_layer.activate();
        accept_point_region = new Path.Rectangle(origin, canvas_size);
        canvas_region = new Path.Rectangle(origin, canvas_size);
        view.draw();

        // Define the mouse marker and it's surroundings
        // These get moved around to follow the mouse
        mouse_track_layer.activate();
        const validation_indicator = new Path.Circle({
            center: new Point(-15, -15),
            radius: 15
        });
        const mouse_marker = new Path.Circle({
            center: new Point(-1, -1),
            radius: 2
        });

        // Initialise the Tool that runs the game
        // This picks up on all mouse events occuring on the canvas and handles appropriately
        var game_tool = new Tool();
        game_tool.onMouseDown = function(event) {
            var location = event.point;
            if (accept_point_region.contains(location)) {
                // Removes point from clickable region
                updateAcceptPointRegion(location);
                // Renders the point on screen
                renderPoint(location);
            } else {
                // If the point is not contained in the accept points region loop through paths and remove appropriate
                var effected_point_indices = [];
                for (var i = 0; i < point_areas_list.length; i++) {
                    // If the point contains the location of the event
                    if (point_areas_list[i].contains(location)) {
                        // Push to effected points
                        effected_point_indices.push(i);
                    }
                }
                // Determine the closest point to the event
                var closest_point_index = effected_point_indices[0];
                var old_point = point_areas_list[effected_point_indices[0]];
                var distance_from_old_to_event = old_point.position.getDistance(location);
                var new_point, distance_from_new_to_event;
                for (var i = 1; i < effected_point_indices.length; i++) {
                    new_point = point_areas_list[effected_point_indices[i]];
                    distance_from_new_to_event = new_point.position.getDistance(location);
                    if (distance_from_new_to_event < distance_from_old_to_event) {
                        distance_from_old_to_event = distance_from_new_to_event;
                        closest_point_index = effected_point_indices[i];
                    }
                }

                // Deal with the removal of a point
                removePoint(effected_point_indices, closest_point_index);
            }
            // Updates mouse appearance after point is placed (should change colour to red as it's no longer in acceptance region)
            updateMouseAppearance(event.point);
            // Redraws the canvas
            view.draw();
        }
        game_tool.onMouseMove = function(event) {
            // Updates the mouse appearance on move so that the mimic mouse follows the actual cursor
            updateMouseAppearance(event.point);
            // Redraws the canvas
            view.draw();
            // Prevents touch scrolling incase somebody uses a touch screen device for this
            return false;
        }
        // Activates the game tool
        game_tool.activate();

        // Moves around the fake mouse that allows indication of whether or not you can place a point
        function updateMouseAppearance(location) {
            // Activates the appropriate layer
            mouse_track_layer.activate();

            // Checks if the event occured as the mouse was leaving
            if (!canvas_region.contains(location)) {
                // If so move mouse off canvas
                validation_indicator.position = new Point(-15, -15);
                mouse_marker.position = new Point(-1, -1);
                return;
            }

            // Move mouse_marker and validation_indicator to event (cursor) position
            validation_indicator.position = location;
            mouse_marker.position = location;

            // Pick the appropriate colour, i.e. whether a click will be accepted or not
            validation_indicator.fillColor = accept_colour;
            mouse_marker.fillColor = "green";
            if (!accept_point_region.contains(location)) {
                validation_indicator.fillColor = reject_colour;
                mouse_marker.fillColor = "red";
            }
        }

        var outer;
        // Removes points appropriately from acceptance region
        function updateAcceptPointRegion(location, remove = true) {
            // Activates the appropriate layer
            base_layer.activate();
            // Defines the area to remove from region
            outer = new Path.Circle({
                center: location,
                radius: 10
            });
            // Adds the path to the points list
            // Removes the region from the acceptance region
            if (remove) {
                accept_point_region = accept_point_region.subtract(outer);
            } else {
                accept_point_region = accept_point_region.unite(outer);
            }
        }

        var colour_point, point_area;
        // Renders a new point at given location
        function renderPoint(location) {
            // Activates the appropriate layer
            point_areas_layer.activate();
            // Defines the area to colour in
            point_area = new Path.Circle({
                center: location,
                radius: 10
            });
            point_area.fillColor = point_colour;
            points_layer.activate();
            colour_point = new Path.Circle({
                center: location,
                radius: 2 
            });
            colour_point.fillColor = "blue";
            // Pushes path to list
            point_images_list.push(colour_point);
            point_areas_list.push(point_area);
        }

        function removePoint(effected_point_indices, removed_point_index) {
            // Remove the point from APR
            updateAcceptPointRegion(point_areas_list[removed_point_index].position, false);
            points_layer.activate();
            // Remove point dot
            point_images_list[removed_point_index].remove();
            point_images_list.splice(removed_point_index, 1);
            // Remove point surrounding
            point_areas_list[removed_point_index].remove();
            point_areas_list.splice(removed_point_index, 1);

            // Re introduce APR for all the other points
            var current_point_index;
            for (var i = 0; i < effected_point_indices.length; i++) {
                current_point_index = effected_point_indices[i];
                if (current_point_index !== removed_point_index) {
                    // Account for array shift from splice
                    if (current_point_index > removed_point_index) {
                        current_point_index--;
                    }
                    // Make sure that each effected point keeps it's APR
                    updateAcceptPointRegion(point_areas_list[current_point_index].position);
                }
            }
        }
    }
}