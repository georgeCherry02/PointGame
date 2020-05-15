// Define properties of canvas
var game_canvas = $("#game_canvas");
var origin = new paper.Point(0, 0);
var canvas_size = new paper.Size(1024, 1024);

// Define colours used
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
        var points_layer = new paper.Layer();
        var base_layer = new paper.Layer();

        // Define acceptance region and the canvas in a shape
        base_layer.activate();
        accept_point_region = new Path.Rectangle(origin, canvas_size);
        canvas_region = new Path.Rectangle(origin, canvas_size);
        view.draw();

        // Initialise the Tool that runs the game
        // This picks up on all mouse events occuring on the canvas and handles appropriately
        var game_tool = new Tool();
        game_tool.onMouseDown = function(event) {
            if (accept_point_region.contains(event.point)) {
                // Activates points_layer
                points_layer.activate();
                // Removes point from clickable region
                updateAcceptPointRegion(event.point);
                // Adds the location to the list of points
                points_list.push(event.point);
                // Renders the point on screen
                renderPoint(event.point);
            }
            // Redraws the canvas
            view.draw();
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
            // Removes the region from the acceptance region
            accept_point_region = accept_point_region.subtract(outer);
        }

        var colour_point;
        // Renders a new point at given location
        function renderPoint(location) {
            // Activates the appropriate layer
            points_layer.activate();
            // Defines the area to colour in
            colour_point = new Path.Circle({
                center: location,
                radius: 10
            });
            // Assigns correct colour to points
            colour_point.fillColor = point_colour;
        }
    }
}