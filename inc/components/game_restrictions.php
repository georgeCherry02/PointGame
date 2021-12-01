<?php
    // Choose a shape at random
    $values = array();
    echo "<script>";
    echo "const MINIMUM_RADIUS = 5;\n";
    echo "const MAXIMUM_RADIUS = 5;\n";
    if (!isset($_GET["f"])) {
        header("Location: default.php");
        exit;
    }
    $freeplay = $_GET["f"] == 1;
    echo "const FREEPLAY = ".($freeplay ? "true" : "false").";\n";
    if (!$freeplay) {
        echo "const NUMBER_OF_CLOSE_NEIGHBOURS = 0;\n";
        // Determine which restrictions will be active 
        $graph_active = rand(0,1) == 1 ? "true" : "false";
        echo "const GRAPH_CHECK_ACTIVE = ".$graph_active.";\n";
        $grid_active = rand(0,1) == 1 ? "true" : "false";
        echo "const GRID_CHECK_ACTIVE = ".$grid_active.";\n";
        echo "const MASK_CHECK_ACTIVE = false;\n";
        $noise_active = rand(0,1) == 1 ? "true" : "false";
        echo "const NOISE_ACTIVE = ".$noise_active.";\n";
        // Generate appropriate restrictions
        // Handle graph restrictions
        $neighbouring_distance_choices = array(25, 40, 50, 60, 75, 100, 150);
        echo "const NEIGHBOURING_DISTANCE = ".$neighbouring_distance_choices[array_rand($neighbouring_distance_choices)].";\n"; // Set neighbouring distance with function here
        $intersecting_edge_check = rand(0,1) == 1;
        echo "const INTERSECTING_EDGE_CHECK_ACTIVE = ".($intersecting_edge_check ? "true" : "false").";\n"; // Set whether intersecting edges are allowed here
        $degree_of_vertices_active = rand(0,1) == 1;
        echo "const DEGREE_OF_VERTICES_CHECK_ACTIVE = ".($degree_of_vertices_active ? "true" : "false").";\n"; // Set whether there is a maximum amount of vertices per node
        $degree_limitation = rand(2,10);
        echo "const DEGREE_OF_VERTICES_LIMITATIONS = ".$degree_limitation.";\n"; // Set maximum degree of vertices allowed here
        $graph_render_active = (($degree_of_vertices_active && $degree_limitation <= 5) || $intersecting_edge_check) ? "true" : "false";
        echo "const GRAPH_RENDER = ".$graph_render_active.";\n"; // Set whether the graph should be rendered here
        // Handle grid restrictions
        echo "const GRID_RENDER = true;\n"; // Set whether the grid should be rendered
        $grid_options = array("SQUARE", "TRIANGLE", "HEXAGON");
        // echo "const GRID_MODE = \"".$grid_options[array_rand($grid_options)]."\";\n"; // Set a grid mode - this needs to be a member of GridType
        echo "const GRID_MODE = \"HEXAGON\";\n"; // Set a grid mode - this needs to be a member of GridType
        $grid_dimensions = rand(5,20);
        echo "const GRID_DIMENSIONS = ".$grid_dimensions.";\n"; // Use this for an x by x amount - this will be determined in javascript
        // Determine density distributions
        $grid_measure = floor($grid_dimensions / 5);
        $max_per_cell = floor(rand(5, 20) / $grid_measure);
        echo "const MAX_NUMBER_PER_GRID_CELL_DISTRIBUTION = {".$max_per_cell.": 100};\n";
        $min_per_cell = rand(0,3);
        if ($grid_dimensions > 8) $min_per_cell = 0;
        echo "const MIN_NUMBER_PER_GRID_CELL_DISTRIBUTION = {".$min_per_cell.": 100};\n";
        // Handle noise restrictions
        $noise_percentage = rand(0,30);
        $max_amount_of_points = $grid_dimensions * $grid_dimensions * $max_per_cell;
        $noise_amount = floor($noise_percentage / 100 * $max_amount_of_points);
        echo "const NOISE_AMOUNT = ".$noise_amount.";\n";
    }
    echo "</script>";
?>