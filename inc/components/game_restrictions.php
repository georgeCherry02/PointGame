<?php
    // Choose a shape at random
    $values = array();
    if (isset($_POST["test"])) {
        // Parse the POST
        $values["freeplay"] = FALSE;
        $values["shape_name"] = $_POST["shape_name"];
        $values["minimum_radius"] = $_POST["minimum_radius"];
        $values["maximum_radius"] = $_POST["maximum_radius"];
        $values["minimum_number"] = $_POST["minimum_number"];
        $values["maximum_number"] = $_POST["maximum_number"];
        $values["number_of_close_neighbours"] = $_POST["number_of_close_neighbours"];
        // Determine which are active
        foreach (CheckTypes::ALL() as $check_type) {
            $values[$check_type->getKey()] = array();
            $check_type_active = isset($_POST[$check_type->getKey()."_active"]);
            $values[$check_type->getKey()]["active"] = $check_type_active;
        }
        // Parse Functions
        if ($values["functions_check"]["active"]) {
            $values["functions_check"]["values"] = array();
            foreach (CheckTypes::Functions()->getSubChecks() as $sub_check) {
                $values["functions_check"]["values"][$sub_check] = array();
                $sub_check_active = isset($_POST[$sub_check."_check_active"]);
                $values["functions_check"]["values"][$sub_check]["active"] = $sub_check_active;
                if ($sub_check_active) {
                    $distribution = array();
                    $range_count = $_POST[$sub_check."_range_count"];
                    for ($i = 2; $i <= $range_count; $i++) {
                        $name = $_POST[$sub_check."_range_".$i."_name"];
                        $top = $_POST[$sub_check."_range_".$i."_top"];
                        $min = $_POST[$sub_check."_range_".$i."_min"];
                        $max = $_POST[$sub_check."_range_".$i."_max"];
                        $distribution[$name] = array("range" => $top, "low" => $min, "high" => $max);
                    }
                    $distribution["max"] = array("low" => $_POST[$sub_check."_range_1_min"], "high" => $_POST[$sub_check."_range_1_max"]);
                    $values["functions_check"]["values"][$sub_check]["value"] = json_encode($distribution);
                }
            }
        }
        // Parse Graph
        if ($values["graph_check"]["active"]) {
            $values["graph_check"]["values"] = array();
            $values["graph_check"]["values"]["graph_render"] = isset($_POST["render_graph"]);
            if ($values["maximum_radius"] <= $values["minimum_radius"]) {
                $values["graph_check"]["values"]["neighbouring_distance"] = $_POST["neighbouring_distance"];
            }
            $values["graph_check"]["values"]["intersecting_edge"] = !isset($_POST["intersecting_edge"]);
            $values["graph_check"]["values"]["degree_of_vertices"]["active"] = isset($_POST["degree_of_vertices_active"]);
            if ($values["graph_check"]["values"]["degree_of_vertices"]["active"]) {
                $values["graph_check"]["values"]["degree_of_vertices"]["value"] = $_POST["degree_of_vertices"];
            }
        }
        // Parse Grid
        if ($values["grid_check"]["active"]) {
            $values["grid_check"]["values"] = array();
            $values["grid_check"]["values"]["grid_render"] = isset($_POST["render_grid"]);
            $values["grid_check"]["values"]["grid_mode"] = $_POST["grid_mode"];
            $values["grid_check"]["values"]["grid_resolution"] = intval($_POST["grid_resolution"]);
            $types = array("max", "min");
            foreach ($types as $type) {
                $distribution = array();
                $density_count = $_POST["grid_density_".$type."_count"];
                for ($i = 1; $i <= $density_count; $i++) {
                    $amount = $_POST["grid_density_".$type."_".$i."_value"];
                    $prop = intval($_POST["grid_density_".$type."_".$i."_prop"]);
                    $distribution[$amount] = $prop;
                }
                $values["grid_check"]["values"][$type."_grid_density"] = json_encode($distribution);
            }
        }
        // Parse Statistics
        if ($values["statistics_check"]["active"]) {
            $values["statistics_check"]["values"] = array();
            $values["statistics_check"]["values"]["mean"] = array();
            $values["statistics_check"]["values"]["mean"]["active"] = isset($_POST["mean_check_active"]);
            if ($values["statistics_check"]["values"]["mean"]["active"]) {
                $distribution = array();
                $distribution["x"] = array("min" => $_POST["x_mean_min"], "max" => $_POST["x_mean_max"]);
                $distribution["y"] = array("min" => $_POST["y_mean_min"], "max" => $_POST["y_mean_max"]);
                $values["statistics_check"]["values"]["mean"]["value"] = json_encode($distribution);
            }
            $values["statistics_check"]["values"]["stdev"]["active"] = isset($_POST["stdev_check_active"]);
            if ($values["statistics_check"]["values"]["stdev"]["active"]) {
                $distribution = array();
                $distribution["x"] = array("min" => $_POST["x_stdev_min"], "max" => $_POST["x_stdev_max"]);
                $distribution["y"] = array("min" => $_POST["y_stdev_min"], "max" => $_POST["y_stdev_max"]);
                $values["statistics_check"]["values"]["stdev"]["value"] = json_encode($distribution);
            }
            $values["statistics_check"]["values"]["ppmcc"]["active"] = isset($_POST["ppmcc_check_active"]);
            if ($values["statistics_check"]["values"]["ppmcc"]["active"]) {
                $distribution = array();
                $distribution["min"] = $_POST["ppmcc_min"];
                $distribution["max"] = $_POST["ppmcc_max"];
                $values["statistics_check"]["values"]["ppmcc"]["value"] = json_encode($distribution);
            }
        }
        // Figure out which checks are active
        // $values = array(
        //     "functions_check" => array(
        //         "active" => true,
        //         "values" => array(
        //             "pcf" => array(
        //                 "active" => true,
        //                 "value" => "{\"short\": {\"range\": 32, \"low\": 0, \"high\": Infinity}, \"medium\": {\"range\": 128, \"low\": 0, \"high\": Infinity}, \"long\": {\"range\": 1450, \"low\": 0, \"high\": Infinity}}"
        //             ),
        //             "nearest_neighbour" => array(
        //                 "active" => true,
        //                 "value" => "{\"short\": {\"range\": 32, \"low\": 0, \"high\": Infinity}, \"medium\": {\"range\": 128, \"low\": 0, \"high\": Infinity}, \"long\": {\"range\": 1450, \"low\": 0, \"high\": Infinity}}"
        //             ),
        //             "spherical_contact" => array(
        //                 "active" => true,
        //                 "value" => "{\"short\": {\"range\": 32, \"low\": 0, \"high\": Infinity}, \"medium\": {\"range\": 128, \"low\": 0, \"high\": Infinity}, \"long\": {\"range\": 1450, \"low\": 0, \"high\": Infinity}}"
        //             ),
        //             "j_function" => array(
        //                 "active" => true,
        //                 "value" => "{\"short\": {\"range\": 32, \"low\": 0, \"high\": Infinity}, \"medium\": {\"range\": 128, \"low\": 0, \"high\": Infinity}, \"long\": {\"range\": 1450, \"low\": 0, \"high\": Infinity}}"
        //             )
        //         )
        //     ),
        //     "graph_check" => array(
        //         "active" => true,
        //         "values" => array(
        //             "neighbouring_distance" => 20,
        //             "intersecting_edge" => true,
        //             "graph_render" => true,
        //             "degree_of_vertices" => array(
        //                 "active" => true,
        //                 "value" => 5
        //             )
        //         )
        //     ),
        //     "grid_check" => array(
        //         "active" => true,
        //         "values" => array(
        //             "grid_mode" => "SQUARE",
        //             "grid_resolution" => 32,
        //             "grid_render" => true,
        //             "max_grid_density" => "{\"50\": 100}",
        //             "min_grid_density" => "{\"0\": 100}"
        //         )
        //     ),
        //     "mask_check" => array(
        //         "active" => false,
        //         "values" => array(
        //             "mask_root" => "test"
        //         )
        //     ),
        //     "statistics_check" => array(
        //         "active" => true,
        //         "values" => array(
        //             "mean" => array(
        //                 "active" => true,
        //                 "value" => "{\"x\": {\"min\": 0, \"max\": 1024}, \"y\": {\"min\": 0, \"max\": 1024}}"
        //             ),
        //             "stdev" => array(
        //                 "active" => true,
        //                 "value" => "{\"x\": {\"min\": 0, \"max\": Infinity}, \"y\": {\"min\": 0, \"max\": Infinity}}"
        //             ),
        //             "ppmcc" => array(
        //                 "active" => true,
        //                 "value" => "{\"min\": -1, \"max\": 1}"
        //             )
        //         )
        //     )
        // );
    } else {
        $values["freeplay"] = TRUE;
        $values["minimum_radius"] = 5;
        $values["shape_name"] = "Square";
    } 
    $_SESSION["Restrictions"] = $values;
    echo "<script>";
    echo "const FREEPLAY = ".$values["freeplay"].";\n";
    echo "const MINIMUM_RADIUS = ".$values["minimum_radius"].";\n";
    echo "const EXPECTED_SHAPE = \"".$values["shape_name"]."\";\n";
    if (!$values["freeplay"]) {
        echo "const MAXIMUM_RADIUS = ".$values["maximum_radius"].";\n";
        echo "const MINIMUM_NUMBER = ".$values["minimum_number"].";\n";
        echo "const MAXIMUM_NUMBER = ".$values["maximum_number"].";\n";
        echo "const NUMBER_OF_CLOSE_NEIGHBOURS = ".$values["number_of_close_neighbours"].";\n";
        foreach (CheckTypes::ALL() as $check_type) {
            $check_type->determineCheckActive($values[$check_type->getKey()]["active"]);
            if ($values[$check_type->getKey()]["active"]) {
                Restrictions::manageCheckType($check_type, $values[$check_type->getKey()]["values"]);
            }
        }
    }
    echo "</script>";
?>