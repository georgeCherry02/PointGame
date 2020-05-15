// Define properties of canvas
var game_canvas = $("#game_canvas");
var origin = new paper.Point(0, 0);
var canvas_size = new paper.Size(1024, 1024);

// Define colours used
const accept_colour = new paper.Color(0.9, 1, 0.9, 1);
const reject_colour = new paper.Color(1, 0.9, 0.9, 1);
const point_colour = new paper.Color(0.9, 0.9, 1, 1);

// Define list of points
var points_list = [];

// Define global paths
var accept_point_region;
var canvas_region;

window.onload = function() {
    with(paper) {
        Logger.log(LoggingType.STATUS, "Initialising canvas");
        setup(game_canvas[0]);

        // Define layers
        var base_layer = new paper.Layer();
        var points_layer = new paper.Layer();
        var mouse_track_layer = new paper.Layer();

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
            radius: 1
        });

        // Initialise the Tool that runs the game
        // This picks up on all mouse events occuring on the canvas and handles appropriately
        var game_tool = new Tool();
        game_tool.onMouseDown = function(event) {
            if (accept_point_region.contains(event.point)) {
                // Activates points_layer
                points_layer.activate();
                // Removes point from clickable region
                updateAcceptPointRegion(event.point);
                // Renders the point on screen
                renderPoint(event.point);
            } else {
                // If the point is not contained in the accept points region loop through paths and remove appropriate
                for (var i = 0; i < points_list.length; i++) {
                    // If the point contains the location of the event
                    if (points_list[i].contains(event.point)) {
                        // Add back to acceptance region
                        updateAcceptPointRegion(points_list[i].position);
                        // Remove from points_layer
                        points_layer.activate();
                        points_list[i].remove();
                        points_list.splice(i, 1);
                        break;
                    }
                }
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
        function updateAcceptPointRegion(location) {
            // Activates the appropriate layer
            base_layer.activate();
            // Defines the area to remove from region
            outer = new Path.Circle({
                center: location,
                radius: 10
            });
            // Adds the path to the points list
            // Removes the region from the acceptance region
            if (accept_point_region.contains(location)) {
                accept_point_region = accept_point_region.subtract(outer);
            } else {
                accept_point_region = accept_point_region.unite(outer);
            }
        }

        var colour_point;
        // Renders a new point at given location
        function renderPoint(location) {
            // Activates the appropriate layer
            points_layer.activate();
            // Defines the area to colour in
            colour_point = new Path.Circle({
                center: location,
                radius: 1 
            });
            // Assigns correct colour to points
            colour_point.fillColor = "black";
            // Pushes path to list
            points_list.push(colour_point);
        }
    }
}