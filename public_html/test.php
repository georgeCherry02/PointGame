<?php
    include_once "../inc/base.php";
    include_once "../inc/classes/Database.php";

    include_once "../inc/enums/Shapes.php";
    include_once "../inc/enums/RestrictionTypes.php";
    include_once "../inc/enums/GridTypes.php";

    $page_title = "Test";
    include_once "../inc/components/header.php";
    include_once "../inc/components/navbar.php";
?>
<script>
    var form_counts = {};
</script>
<form method="POST" action="game.php" style="width: 50%;" class="mt-5 ml-auto mr-auto">
    <input type="hidden" name="test" value="true"/>
    <h4>General Restrictions:</h4>
    <div class="form-group">
        <label for="shape_type"><h5>Shape:</h5></label>
        <select class="form-control" id="shape_type" name="shape_name">
            <?php
                foreach(Shapes::ALL() as $shape) {
                    echo "<option value=\"".$shape->getName()."\">".$shape->getName()."</option>";
                }
            ?>
        </select>
        <label for="minimum_radius"><h5>Minimum Radius:</h5></label>
        <input type="number" class="form-control" name="minimum_radius" id="minimum_radius" min="0"/>
        <label for="maximum_radius"><h5>Maximum Radius:</h5></label>
        <input type="number" class="form-control" name="maximum_radius" id="maximum_radius" min="0"/>
        <label for="number_of_close_neighbours"><h5>Number of close neighbours:</h5></label>
        <input type="number" class="form-control" id="number_of_close_neighbours" name="number_of_close_neighbours" min="0"/>
        <label for="minimum_number"><h5>Minimum number:</h5></label>
        <input type="number" class="form-control" name="minimum_number" id="minimum_number" min="0"/>
        <label for="maximum_number"><h5>Maximum number:</h5></label>
        <input type="number" class="form-control" name="maximum_number" id="maximum_number" min="0"/>
    </div>
    <hr/>
    <h4>Function Restrictions:</h4>
    <div class="form-group">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" name="functions_check_active" id="functions_active"/>
            <label class="form-check-label" for="functions_active">
                Active
            </label>
        </div>
        <div id="function_form_segment">
            <hr/>
<?php
    $distribution_types = array("pcf" => "PCF", "nearest_neighbour" => "Nearest Neighbour", "spherical_contact" => "Spherical Contact", "j_function" => "J-Function");
    foreach ($distribution_types as $type => $pretty_name) {
        $html = "<h5 class=\"mt-2\">".$pretty_name.":</h5>"
              . "<div class=\"form-check\">"
              .     "<input class=\"form-check-input\" type=\"checkbox\" value=\"\" name=\"".$type."_check_active\" id=\"".$type."_active\"/>"
              .     "<label class=\"form-check-label\" for=\"".$type."_active\">"
              .         "Active"
              .     "</label>"
              . "</div>"
              . "<div id=\"".$type."_description\" class=\"form-group\">"
              .     "<input type=\"hidden\" name=\"".$type."_range_count\" id=\"".$type."_range_count\" value=\"1\"/>"
              .     "<div class=\"form-row\">"
              .         "<div class=\"col-10\"></div>"
              .         "<div class=\"col-1\">"
              .             "<button id=\"".$type."_remove_button\" class=\"btn btn-danger btn-sm float-right\">"
              .                 "<i class=\"fas fa-minus\"></i>"
              .             "</button>"
              .         "</div>"
              .         "<div class=\"col-1\">"
              .             "<button id=\"".$type."_add_button\" class=\"btn btn-success btn-sm\">"
              .                 "<i class=\"fas fa-plus\"></i>"
              .             "</button>"
              .         "</div>"
              .     "</div>"
              .     "<div id=\"range_1_container\">"
              .         "<label for=\"".$type."_range_1_name\">Name 1:</label>"
              .         "<input type=\"text\" class=\"form-control\" name=\"".$type."_range_1_name\" id=\"".$type."_range_1_name\"/>"
              .         "<label for=\"".$type."_range_1_top\">Top distance 1:</label>"
              .         "<input type=\"number\" class=\"form-control\" name=\"".$type."_range_1_top\" id=\"".$type."_range_1_top\"/>"
              .         "<label for=\"".$type."_range_1_max\">Average maximum 1:</label>"
              .         "<input type=\"number\" class=\"form-control\" name=\"".$type."_range_1_max\" id=\"".$type."_range_1_max\"/>"
              .         "<label for=\"".$type."_range_1_min\">Average minimum 1:</label>"
              .         "<input type=\"number\" class=\"form-control\" name=\"".$type."_range_1_min\" id=\"".$type."_range_1_min\"/>"
              .     "</div>"
              .     "<small>Make sure your last range's top distance is 1450</small>"
              .     "<script>\n"
              .     "   form_counts[\"".$type."\"] = 1;\n"
              .     "</script>"
              . "</div>";
        echo $html;
    }
?>
        </div>
    </div>
    <hr/>
    <h4>Graph Restrictions:</h4>
    <div class="form-group">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" name="graph_check_active" id="graph_active"/>
            <label class="form-check-label" for="graph_active">
                Active
            </label>
        </div>
        <div id="graph_form_segment">
            <hr/>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="" name="render_graph" id="render_graph"/>
                <label class="form-check-label" for="render_graph">
                    Render graph
                </label>
            </div>
            <div id="neighbouring_distance_container">
                <label for="neighbouring_distance"><h5>Neighbouring Distance:</h5></label>
                <input type="number" class="form-control" id="neighbouring_distance" name="neighbouring_distance" min="0"/>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="" name="intersecting_edge" id="intersecting_edge"/>
                <label class="form-check-label" for="intersecting_edge">
                    Intersecting edges allowed
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="" name="degree_of_vertices_active" id="degree_of_vertices_active"/>
                <label class="form-check-label" for="degree_of_vertices_active">
                    Degree of vertices limitation
                </label>
            </div>
            <div id="degree_of_vertices_container">
                <label for="degree_of_vertices"><h5>Maximum degree of vertices:</h5></label>
                <input type="number" class="form-control" id="degree_of_vertices" name="degree_of_vertices" min="0"/>
            </div>
        </div>
    </div>
    <hr/>
    <h4>Grid Restrictions:</h4>
    <div class="form-group">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" name="grid_check_active" id="grid_active"/>
            <label class="form-check-label" for="grid_active">
                Active
            </label>
        </div>
        <div id="grid_form_segment">
            <hr/>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="" name="render_grid" id="render_grid"/>
                <label class="form-check-label" for="render_grid">
                    Render grid
                </label>
            </div>
            <label for="grid_mode"><h5>Grid Mode:</h5></label>
            <select class="form-control" id="grid_mode" name="grid_mode">
                <?php
                    foreach(GridTypes::ALL() as $type) {
                        echo "<option value=\"".$type->getName()."\">".$type->getName()."</option>";
                    }
                ?>
            </select>
            <label for="grid_resolution"><h5>Grid Resolution:</h5></label>
            <input type="number" class="form-control" id="grid_resolution" name="grid_resolution" min="0"/>
            <small>Hexagon = "Radius" &vert; Square &amp; Triangle = Side length</small>
            <hr/>
            <label for="grid_density_max_container"><h5>Grid density maximums</h5></label>
            <div id="grid_density_max_container">
                <input type="hidden" name="grid_density_max_count" id="grid_density_max_count" value="1"/>
                <div class="form-row">
                    <div class="col-10"></div>
                    <div class="col-1">
                        <button id="density_max_remove_button" class="btn btn-danger btn-sm float-right">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                    <div class="col-1">
                        <button id="density_max_add_button" class="btn btn-success btn-sm">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="grid_density_max_1">
                    <label for="grid_density_max_1_prob">Probability 1:</label>
                    <input type="number" class="form-control" id="grid_density_max_1_prob" name="grid_density_max_1_prob" min="0" max="100"/>
                    <label for="grid_density_max_1_value">Value 1:</label>
                    <input type="number" class="form-control" id="grid_density_max_1_value" name="grid_density_max_1_value" min="0"/>
                </div>
            </div>
            <hr/>
            <label for="grid_density_min_container"><h5>Grid density minimums</h5></label>
            <div id="grid_density_min_container">
                <input type="hidden" name="grid_density_min_count" id="grid_density_min_count" value="1"/>
                <div class="form-row">
                    <div class="col-10"></div>
                    <div class="col-1">
                        <button id="density_min_remove_button" class="btn btn-danger btn-sm float-right">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                    <div class="col-1">
                        <button id="density_min_add_button" class="btn btn-success btn-sm">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="grid_density_min_1">
                    <label for="grid_density_min_1_prob">Probability 1:</label>
                    <input type="number" class="form-control" id="grid_density_min_1_prob" name="grid_density_min_1_prob" min="0" max="100"/>
                    <label for="grid_density_min_1_value">Value 1:</label>
                    <input type="number" class="form-control" id="grid_density_min_1_value" name="grid_density_min_1_value" min="0"/>
                </div>
            </div>
            <script>
                form_counts["density_min"] = 1;
                form_counts["density_max"] = 1;
            </script>
        </div>
    </div>
    <hr/>
    <h4>Statistics Restrictions:</h4>
    <div class="form-group">
        <div class="form-check">
            <input class="form-check-input" type="checkbox" name="statistics_check_active" id="statistics_active"/>
            <label class="form-check-label" for="grid_active">
                Active
            </label>
        </div>
        <div id="statistics_form_segment">
            <hr/>
            <h5 class="mt-2">Mean:</h5>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="mean_check_active" id="mean_active">
                <label class="form-check-label" for="mean_active">
                    Active
                </label>
            </div>
            <div class="form-group" id="mean_description">
                <label for="x_mean_min"><h5>Minimum X:</h5></label>
                <input type="number" class="form-control" id="x_mean_min" name="x_mean_min" min="0" max="1024"/>
                <label for="x_mean_max"><h5>Maximum X:</h5></label>
                <input type="number" class="form-control" id="x_mean_max" name="x_mean_max" min="0" max="1024"/>
                <label for="y_mean_min"><h5>Minimum Y:</h5></label>
                <input type="number" class="form-control" id="y_mean_min" name="y_mean_min" min="0" may="1024"/>
                <label for="y_mean_max"><h5>Mayimum Y:</h5></label>
                <input type="number" class="form-control" id="y_mean_max" name="y_mean_max" min="0" may="1024"/>
            </div>
            <h5 class="mt-2">Standard Deviation:</h5>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="stdev_check_active" id="stdev_active">
                <label class="form-check-label" for="stdev_active">
                    Active
                </label>
            </div>
            <div class="form-group" id="stdev_description">
                <label for="x_stdev_min"><h5>Minimum X:</h5></label>
                <input type="number" class="form-control" id="x_stdev_min" name="x_stdev_min" min="0" max="1024"/>
                <label for="x_stdev_max"><h5>Maximum X:</h5></label>
                <input type="number" class="form-control" id="x_stdev_max" name="x_stdev_max" min="0" max="1024"/>
                <label for="y_stdev_min"><h5>Minimum Y:</h5></label>
                <input type="number" class="form-control" id="y_stdev_min" name="y_stdev_min" min="0" may="1024"/>
                <label for="y_stdev_max"><h5>Mayimum Y:</h5></label>
                <input type="number" class="form-control" id="y_stdev_max" name="y_stdev_max" min="0" may="1024"/>
            </div>
            <h5 class="mt-2">PPMCC:</h5>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="ppmcc_check_active" id="ppmcc_active">
                <label class="form-check-label" for="ppmcc_active">
                    Active
                </label>
            </div>
            <div class="form-group" id="ppmcc_description">
                <label for="ppmcc_min"><h5>Minimum PPMCC:</h5></label>
                <input type="number" class="form-control" id="ppmcc_min" name="ppmcc_min" min="-1" max="1" step="0.01"/>
                <label for="ppmcc_max"><h5>Maximum PPMCC:</h5></label>
                <input type="number" class="form-control" id="ppmcc_max" name="ppmcc_max" min="-1" max="1" step="0.01"/>
            </div>
        </div>
    </div>
    <input type="submit" class="btn btn-primary" value="Test!"/>
</form>
<script>
    var test = {};
    test.initialiseForm = function() {
        $("#neighbouring_distance_container").hide();
        $("#minimum_radius").change(test.handleRadiusChange);
        $("#maximum_radius").change(test.handleRadiusChange);
        $("#function_form_segment").hide();
        $("#functions_active").change(() => {$("#function_form_segment").toggle(); document.getElementById("function_form_segment").scrollIntoView({behavior: "smooth"});});
<?php
    foreach ($distribution_types as $type => $pretty_name) {
        $script =   "       $(\"#".$type."_description\").hide();\n"
                    // The PHP parser just breaks here if the string isn't split at "...{$(\"#..."
                .   "       $(\"#".$type."_active\").change(() => {"."$(\"#".$type."_description\").toggle(); document.getElementById(\"".$type."_description\").scrollIntoView({behavior: \"smooth\"});});\n"
                .   "       $(\"#".$type."_remove_button\").hide();\n"
                .   "       $(\"#".$type."_remove_button\").click((e) => {test.removeRangeLimitation(\"".$type."\"); e.preventDefault();});\n"
                .   "       $(\"#".$type."_add_button\").click((e) => {test.addRangeLimitation(\"".$type."\"); e.preventDefault();});\n";
        echo $script;
    }
?>
        $("#graph_form_segment").hide();
        $("#graph_active").change(() => {$("#graph_form_segment").toggle(); document.getElementById("graph_form_segment").scrollIntoView({behavior: "smooth"});});
        $("#degree_of_vertices_container").hide();
        $("#degree_of_vertices_active").change((e) => {
            test.toggleContainer("degree_of_vertices", $("#"+e.target.id).prop("checked"));
        })
        $("#grid_form_segment").hide();
        $("#grid_active").change(() => {$("#grid_form_segment").toggle(); document.getElementById("grid_form_segment").scrollIntoView({behavior: "smooth"});});
        $("#density_min_remove_button").hide();
        $("#density_min_remove_button").click((e) => {test.removeGridLimitation("density_min"); e.preventDefault();});
        $("#density_min_add_button").click((e) => {test.addGridLimitation("density_min"); e.preventDefault();});
        $("#density_max_remove_button").hide();
        $("#density_max_remove_button").click((e) => {test.removeGridLimitation("density_max"); e.preventDefault();});
        $("#density_max_add_button").click((e) => {test.addGridLimitation("density_max"); e.preventDefault();});
        $("#statistics_form_segment").hide();
        $("#statistics_active").change(() => {$("#statistics_form_segment").toggle(); document.getElementById("statistics_form_segment").scrollIntoView({behavior: "smooth"});});
        $("#mean_description").hide();
        $("#mean_active").click(() => {$("#mean_description").toggle(); document.getElementById("mean_description").scrollIntoView({behavior: "smooth"});});
        $("#stdev_description").hide();
        $("#stdev_active").click(() => {$("#stdev_description").toggle(); document.getElementById("stdev_description").scrollIntoView({behavior: "smooth"});});
        $("#ppmcc_description").hide();
        $("#ppmcc_active").click(() => {$("#ppmcc_description").toggle(); document.getElementById("ppmcc_description").scrollIntoView({behavior: "smooth"});});
    }
    test.handleRadiusChange = function() {
        var min_radius = parseInt($("#minimum_radius").val());
        var max_radius = parseInt($("#maximum_radius").val());
        var chaining = max_radius > min_radius;
        test.toggleContainer("neighbouring_distance", !chaining);
    }
    test.toggleContainer = function(name, reveal) {
        $("#"+name+"_container").hide();
        $("#"+name).val("");
        if (reveal) {
            $("#"+name+"_container").show();
        }
    }
    test.addRangeLimitation = function(container_type) {
        var init_amount = form_counts[container_type];
        if (init_amount == 1) {
            $("#"+container_type+"_remove_button").show();
        } else if (init_amount == 9) {
            $("#"+container_type+"_add_button").remove();
        } else if (init_amount == 10) {
            return;
        }
        var container = $("#"+container_type+"_description");
        var new_amount = init_amount + 1;
        var new_input_html =    "<div id=\""+container_type+"_range_"+new_amount+"_container\">"
                           +        "<hr/>"
                           +        "<label for=\""+container_type+"_range_"+new_amount+"_name\">Name "+new_amount+":</label>"
                           +        "<input type=\"text\" class=\"form-control\" name=\""+container_type+"_range_"+new_amount+"_name\" id=\""+container_type+"_range_"+new_amount+"_name\"/>"
                           +        "<label for=\""+container_type+"_range_"+new_amount+"_top\">Top distance "+new_amount+":</label>"
                           +        "<input type=\"text\" class=\"form-control\" name=\""+container_type+"_range_"+new_amount+"_top\" id=\""+container_type+"_range_"+new_amount+"_top\"/>"
                           +        "<label for=\""+container_type+"_range_"+new_amount+"_max\">Average maximum "+new_amount+":</label>"
                           +        "<input type=\"text\" class=\"form-control\" name=\""+container_type+"_range_"+new_amount+"_max\" id=\""+container_type+"_range_"+new_amount+"_max\"/>"
                           +        "<label for=\""+container_type+"_range_"+new_amount+"_min\">Average minimum "+new_amount+":</label>"
                           +        "<input type=\"text\" class=\"form-control\" name=\""+container_type+"_range_"+new_amount+"_min\" id=\""+container_type+"_range_"+new_amount+"_min\"/>"
                           +    "</div>";
        container.append(new_input_html);
        form_counts[container_type]++;
        $("#"+container_type+"_range_count").val(form_counts[container_type]);
    }
    test.removeRangeLimitation = function(container) {
        var init_amount = form_counts[container];
        if (init_amount == 1) {
            return;
        } else if (init_amount == 2) {
            $("#"+container+"_remove_button").hide();
        } else if (init_amount == 10) {
            $("#"+container+"_add_button").show();
        }
        $("#"+container+"_range_"+init_amount+"_container").remove();
        form_counts[container]--;
        $("#"+container+"_range_count").val(form_counts[container]);
    }
    test.addGridLimitation = function(container_type) {
        var init_amount = form_counts[container_type];
        if (init_amount == 1) {
            $("#"+container_type+"_remove_button").show();
        } else if( init_amount == 9) {
            $("#"+container_type+"_add_button").hide();
        } else if (init_amount == 10) {
            return;
        }
        var container = $("#grid_"+container_type+"_container");
        var new_amount = init_amount + 1;
        var new_input_html =    "<div id=\"grid_"+container_type+"_"+new_amount+"_container\">"
                           +        "<hr/>"
                           +        "<label for=\"grid_"+container_type+"_"+new_amount+"_prob\">Probability "+new_amount+":</label>"
                           +        "<input type=\"number\" class=\"form-control\" id=\"grid_"+container_type+"_"+new_amount+"_prob\" name=\"grid_"+container_type+"_"+new_amount+"_prob\" min=\"0\" max=\"100\"/>"
                           +        "<label for=\"grid_"+container_type+"_"+new_amount+"_value\">Value "+new_amount+":</label>"
                           +        "<input type=\"number\" class=\"form-control\" id=\"grid_"+container_type+"_"+new_amount+"_value\" name=\"grid_"+container_type+"_"+new_amount+"_value\" min=\"0\"/>"
                           +    "</div>";
        container.append(new_input_html);
        form_counts[container_type]++;
        $("#grid_"+container_type+"_count").val(form_counts[container_type]);
    }
    test.removeGridLimitation = function(container_type) {
        var init_amount = form_counts[container_type];
        if (init_amount == 1) {
            return;
        } else if (init_amount == 2) {
            $("#"+container_type+"_remove_button").hide();
        } else if (init_amount == 10) {
            $("#"+container_type+"_add_button").show();
        }
        $("#grid_"+container_type+"_"+init_amount+"_container").remove();
        form_counts[container_type]--;
        $("#grid_"+container_type+"_count").val(form_counts[container_type]);
    }
    window.onload = function() {
        test.initialiseForm();
    }
</script>
<?php
    include_once "../inc/components/footer.php";
?>