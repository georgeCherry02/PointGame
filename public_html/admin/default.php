<?php
    $admin = TRUE;
    include_once "../../inc/base.php";
    include_once "../../inc/admin_constants.php";
    include_once "../../inc/classes/Admin.php";

    $page_title = "Admin";
    include_once "../../inc/components/header.php";
?>
<div class="container mt-5" id="admin_content_container">
<?php
    if (isset($_POST["user"]) && isset($_POST["pass"])) {
        Admin::logUserIn($_POST["user"], $_POST["pass"]);
    }
    if (Admin::isLoggedIn()) {
        // Include admin page
        include_once "../../inc/classes/Database.php";
        include_once "../../inc/classes/Restrictions.php";
        include_once "../../inc/enums/RestrictionTypes.php";
        include_once "../../inc/components/ajax.php";
?>
<div id="admin_action_accordion">
    <div class="card mb-3">
        <div class="card-header" id="restrictions_heading">
            <h5 class="mb-0">
                <button class="btn btn-link highlight-text" data-toggle="collapse" data-target="#restrictions_content" aria-expanded="false" aria-controls="restrictions_content">
                    Restrictions
                </button>
            </h5>
        </div>
        <div id="restrictions_content" class="collapse" aria-labelledby="restrictions_heading" data-parent="#admin_action_accordion">
            <div class="card-body">
                <p class="mb-1 grey-text">Current Restrictions:</p>
                <div id="restrictions_accordion">
                <?php
                    $restriction_sets = Restrictions::fetchAll();
                    if (gettype($restriction_sets) === "array") {
                        if (sizeof($restriction_sets) === 0) {
                            echo "<p class=\"grey-text\">Looks like you don't have any restrictions yet!</p>";
                        }
                        foreach ($restriction_sets as $restriction_set) {
                            $id = $restriction_set["ID"];
                            $html = "<div class=\"card mb-3\">"
                                  .     "<div class=\"card-header\" id=\"restriction_".$id."_heading\">"
                                  .         "<div class=\"row\">"
                                  .             "<div class=\"col-1 text-center\">"
                                  .                 "<input class=\"active_restriction_check\" type=\"radio\" name=\"activeRestrictionRadio\" id=\"exampleRadio".$id."\" value=\"".$id."\" onclick=\"restriction.set_active(".$id.")\"";
                            if ($restriction_set["Active"] == 1) {
                                $html .= " checked";
                            }
                            $html.=                 ">"
                                  .             "</div>"
                                  .             "<div class=\"col-9\">"
                                  .                 "<h5 class=\"mb-0\">"
                                  .                     "<button class=\"btn btn-link highlight-text\" data-toggle=\"collapse\" data-target=\"#restriction_".$id."_content\" aria-expanded=\"false\" aria-controls=\"restriction_".$id."_content\">"
                                  .                         $restriction_set["Name"]
                                  .                     "</button>"
                                  .                 "</h5>"
                                  .             "</div>"
                                  .             "<div class=\"col-1\">"
                                  .                 "<i class=\"fas fa-pencil-alt restrictions_set_button text-muted highlight-text-hover\" onclick=\"restriction.request_edit_set(".$id.")\"></i>"
                                  .             "</div>"
                                  .             "<div class=\"col-1\">"
                                  .                 "<i class=\"fas fa-trash restrictions_set_button text-muted highlight-text-hover\" onclick=\"restriction.remove_set(".$id.")\"></i>"
                                  .             "</div>"
                                  .         "</div>"
                                  .     "</div>"
                                  .     "<div id=\"restriction_".$id."_content\" class=\"collapse\" aria-labelledby=\"restriction_".$id."_heading\" data-parent=\"#restrictions_accordion\">"
                                  .         "<div class=\"card-body\">"
/* ##############################################################################################################
   # Need to sort out how this is displayed
*/ ##############################################################################################################
                                  .             "<p>TEST</p>"
                                  .             "<p>".$restriction_set["Minimum_Radius_Distributions"]."</p>"
                                  .             "<p>".$restriction_set["Maximum_Radius_Distributions"]."</p>"
                                  .             "<p>".$restriction_set["Minimum_Number_Distributions"]."</p>"
                                  .             "<p>".$restriction_set["Maximum_Number_Distributions"]."</p>"
                                  .         "</div>"
                                  .     "</div>"
                                  . "</div>";
                            echo $html;
                        }
                    } else {
                        echo "Server Error!";
                    }
                ?>
                </div>
                <button class="btn btn-primary highlight-background highlight-border" data-toggle="collapse" data-target="#restriction_addition_form" aria-expanded="false" aria-controls="restriction_addition_form">Add new restriction</button>
            </div>
            <div id="restriction_addition_form" class="card-body collapse">
                <form action="./createRestrictionSet.php" id="create_restriction_set_form" method="POST">
                    <div class="form-group">
                        <label for="restriction_set_name">Name</label>
                        <input type="text" class="form-control" id="restriction_set_name" name="name" placeholder="Restriction Set Name"/>
                    </div>
                    <?php
                        foreach (RestrictionTypes::ALL() as $restriction_type) {
                            echo $restriction_type->getFormGroupRender();
                        }
                    ?>
                    <div class="form-row">
                        <div class="col-1"></div>
                        <div class="col-4">
                            <button type="submit" id="create_restriction_set_submit" class="btn btn-primary form-control highlight-background highlight-border" name="create">Create</button>
                        </div>
                        <div class="col-2"></div>
                        <div class="col-4">
                            <button type="submit" id="create_active_restriction_set_submit" class="btn btn-primary form-control highlight-background highlight-border" name="create_and_active">Create and set active</button>
                        </div>
                        <div class="col-1"></div>
                    </div>
                </form>
                <script src="../scripts/restrictions.js"></script>
            </div>
        </div>
    </div>
<?php
/* ##########################################################################################
   # This just doesn't exist yet, need to talk to Josh to find out exactly what we need here
*/ ##########################################################################################
?>
    <div class="card">
        <div class="card-header" id="data_heading">
            <h5 class="mb-0">
                <button class="btn btn-link highlight-text" data-toggle="collapse" data-target="#data_content" aria-expanded="false" aria-controls="data_content">
                    Data Management
                </button>
            </h5>
        </div>
        <div id="data_content" class="collapse" aria-labelledby="data_heading" data-parent="#admin_action_accordion">
            <div class="card-body">
                <h6 class="mb-0">Here you can manage the data collected</h6>
                <form action="./request_data.php" method="POST">
                    <p>Select when you want point patterns from...</p>
                    <input type="date" class="form-control mb-3" name="backdate"/>
                    <p>Select the average score you want the point patterns to be above or equal to (0->100)</p>
                    <input type="number" class="form-control mb-3" name="score"/>
                    <p>Select the number of reviews that you want the point patterns to have gone through</p>
                    <input type="number" class="form-control mb-3" name="review_number"/>
                    <p>Select the maximum number of patterns you want written to file</p>
                    <input type="number" class="form-control mb-3" name="pattern_number"/>
                    <input type="submit" class="btn btn-primary" value="Download"/>
                </form>
            </div>
        </div>
    </div>
</div>
<?php
    } else {
        // Include login form
?>
    <form action="" method="POST">
        <div class="form-group">
            <label for="username">User</label>
            <input type="text" class="form-control" id="username" name="user" placeholder="Admin Username"/>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" class="form-control" id="password" name="pass" placeholder="Admin Password"/>
        </div>
        <button type="submit" class="btn btn-primary highlight-background highlight-border">Login</button>
    </form>
<?php
    }
?>
</div>
<?php
    include_once "../../inc/components/footer.php";
?>