var restriction = {};
restriction.add_form_element = function(type) {
    // Reveal the remove button if not currently revealed
    $("#"+type+"_remove_button").show();
    // Determine initial and new amount of inputs
    var init_amount = parseInt($("#"+type+"_number").val());
    var new_amount = init_amount + 1;
    // Find the renderable name
    var pretty_name = get_pretty_name(type);
    // Declare the object to be rendered
    var new_row =   "<div id=\""+type+"_"+new_amount+"\" class=\"form-row\">"
                +       "<div class=\"col-8\">"
                +           "<small id=\""+type+"_"+new_amount+"_desc\" class=\"form-text text-muted ml-1\">"+pretty_name+" "+new_amount+"</small>"
                +           "<input type=\"number\" id=\""+type+"_input_"+new_amount+"\" name=\""+type+"_"+new_amount+"\" class=\"form-control\" placeholder=\""+pretty_name+" (px)\" aria-describedby=\""+type+"_"+new_amount+"_desc\"/>"
                +       "</div>"
                +       "<div class=\"col-4\">"
                +           "<input type=\"number\" id=\""+type+"_chance_input_"+new_amount+"\" name=\""+type+"_chance_"+new_amount+"\" min=\"1\" max=\"100\" class=\"form-control percentage_input\" placeholder=\"Likelihood\"/>"
                +       "</div>"
                +   "</div>";
    // Append the new form group
    $("#"+type+"_group").append(new_row);
    // Update the hidden input to have the correct amount
    $("#"+type+"_number").val(new_amount);
}
restriction.remove_form_element = function(type) {
    var init_amount = parseInt($("#"+type+"_number").val());
    if (init_amount === 1) {
        return;
    } else if (init_amount === 2) {
        $("#"+type+"_remove_button").hide();
    }
    var new_amount = init_amount - 1;
    $("#"+type+"_"+init_amount).remove();
    $("#"+type+"_number").val(new_amount);
}
restriction.request_edit_set = function(id) {
    var process = "requestEditSet";
    var data = {"edit_id": id};
    $.ajax({
        type: "POST",
        url: "adminAPI.php",
        data: {
            "ajax_token":   AJAX_TOKEN,
            "process":      process,
            "data":         JSON.stringify(data)
        },
        success: function(raw_response) {
            var response = JSON.parse(raw_response);
            if (response.status === "success") {
                // Edit form to represent current status of this restriction set
                restriction.update_form(response.set_info);
                // Reveal form
                $("#restriction_addition_form").removeClass("collapse");
            } else {
                Logger.log(LoggingType.ERROR, ["Server error occured!", "Failed to fetch set data"]);
            }
        },
        error: function() {
            Logger.log(LoggingType.ERROR, ["Server error occured!"]);
        }
    })
}
restriction.remove_set = function(id) {
    var process = "removeRestrictionSet";
    var data = {"remove_id": id};
    $.ajax({
        type: "POST",
        url: "adminAPI.php",
        data: {
            "ajax_token":   AJAX_TOKEN,
            "process":      process,
            "data":         JSON.stringify(data)
        },
        success: function(raw_response) {
            var response = JSON.parse(raw_response);
            if (response.status === "success") {
                window.location.reload();
            } else {
                // Check if it's because it's the last one and explain
                if (response.error_code === 3) {
                    var alert_html = "<div class=\"alert alert-error grey-text\">"
                                   +    "<button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button>"
                                   +    "<strong>Error!</strong> You can't delete your last restriction set!"
                                   + "</div>";
                    $("#admin_content_container").prepend(alert_html);
                } else {
                    var error_messages = [];
                    if (response.process === process) {
                        error_messages.push("Error Code: "+response.error_code);
                    }
                    error_messages.push("Error Message: "+response.error_message);
                    Logger.log(LoggingType.ERROR, error_messages);
                }
            }
        },
        error: function() {
            Logger.log(LoggingType.ERROR, ["Server error occured!"]);
        }
    });
}
restriction.set_active = function(id) {
    var process = "setRestrictionSetActive";
    var data = {"active_id": id};
    $.ajax({
        type: "POST",
        url: "adminAPI.php",
        data: {
            "ajax_token":   AJAX_TOKEN,
            "process":      process,
            "data":         JSON.stringify(data)
        },
        success: function(raw_response) {
            var response = JSON.parse(raw_response);
            if (response.status === "success") {
                // UI response shows highlighted button so no need to modify anything here
                Logger.log(LoggingType.STATUS, "Set restriction set " + response.id + " active");
            } else {
                // Fatal error, reload page
                Logger.log(LoggingType.ERROR, [response.error_message]);
                window.location.reload();
            }
        },
        error: function() {
            Logger.log(LoggingType.ERROR, ["Server error occured!"]);
        }
    })
}
restriction.update_form = function(set_data) {
    // Add hidden ID field for update
    $("#create_restriction_set_form").append("<input type=\"hidden\" name=\"update_id\" value=\""+set_data["ID"]+"\"/>");
    // Set name to correct value in form
    $("#restriction_set_name").val(set_data["Name"]);
    // Set up the rest of the form
    var initial_input_amount, final_input_amount, increase_form_inputs, form_shift_start, form_shift_end;
    var restriction_magnitudes, restriction_probabilities;
    for (var restriction_type in set_data) {
        // Skip if the key is Name
        if (restriction_type === "Name" || restriction_type === "ID") {
            continue;
        }
        // Gather data about restriction set
        restriction_magnitudes = set_data[restriction_type].magnitudes;
        restriction_probabilities = set_data[restriction_type].probabilities;
        // Find difference between initial and final form
        initial_input_amount = parseInt($("#"+restriction_type+"_number").val());
        final_input_amount = restriction_magnitudes.length;
        increase_form_inputs = final_input_amount - initial_input_amount > 0;
        // Begin to modify number of form inputs
        if (increase_form_inputs) {
            for (var i = initial_input_amount; i < final_input_amount; i++) {
                this.add_form_element(restriction_type);
            }
        } else {
            for (var i = initial_input_amount; i > final_input_amount; i--) {
                this.remove_form_element(restriction_type);
            }
        }
        // Modify actual input values
        for (var i = 1; i <= final_input_amount; i++) {
            $("#"+restriction_type+"_input_"+i).val(restriction_magnitudes[i-1]);
            $("#"+restriction_type+"_chance_input_"+i).val(restriction_probabilities[i-1]);
        }
    }
    // Change text on submit buttons
    $("#create_restriction_set_submit").html("Update");
    $("#create_active_restriction_set_submit").html("Update and set active");
}

function get_pretty_name(functional_name) {
    var first_part = functional_name.slice(0, functional_name.indexOf("_"));
    var second_part = functional_name.slice(functional_name.indexOf("_") + 1, functional_name.length);
    return capitalise_first_char(first_part) + " " + capitalise_first_char(second_part);
}
function capitalise_first_char(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

$(document).ready(function() {
    $("#minimum_radius_add_button").click(function(event) { 
        event.preventDefault();
        restriction.add_form_element("minimum_radius");
    });
    $("#minimum_radius_remove_button").click(function(event) { 
        event.preventDefault();
        restriction.remove_form_element("minimum_radius");
    });
    $("#minimum_radius_remove_button").hide();
    $("#maximum_radius_add_button").click(function(event) { 
        event.preventDefault();
        restriction.add_form_element("maximum_radius");
    });
    $("#maximum_radius_remove_button").click(function(event) { 
        event.preventDefault();
        restriction.remove_form_element("maximum_radius");
    });
    $("#maximum_radius_remove_button").hide();
    $("#minimum_number_add_button").click(function(event) { 
        event.preventDefault();
        restriction.add_form_element("minimum_number");
    });
    $("#minimum_number_remove_button").click(function(event) { 
        event.preventDefault();
        restriction.remove_form_element("minimum_number");
    });
    $("#minimum_number_remove_button").hide();
    $("#maximum_number_add_button").click(function(event) { 
        event.preventDefault();
        restriction.add_form_element("maximum_number");
    });
    $("#maximum_number_remove_button").click(function(event) { 
        event.preventDefault();
        restriction.remove_form_element("maximum_number");
    });
    $("#maximum_number_remove_button").hide();
});