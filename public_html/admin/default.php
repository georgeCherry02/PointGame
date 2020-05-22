<?php
    include_once "../../inc/admin_constants.php";
    include_once "../../inc/classes/Admin.php";

    $page_title = "Admin";
    include_once "../../inc/components/header.php";
?>
<div class="container mt-5">
<?php
    if (isset($_POST["user"]) && isset($_POST["pass"])) {
        Admin::logUserIn($_POST["user"], $_POST{"pass"});
    }
    if (Admin::isLoggedIn()) {
        // Include admin page
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
            </div>
        </div>
    </div>
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