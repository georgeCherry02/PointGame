<?php
    include_once "../../inc/admin_constants.php";
    include_once "../../inc/classes/Admin.php";

    $page_title = "Admin";
    include_once "../../inc/components/header.php";
?>
<div class="container">
<?php
    if (isset($_POST["user"]) && isset($_POST["pass"])) {
        Admin::logUserIn($_POST["user"], $_POST{"pass"});
    }
    if (Admin::isLoggedIn()) {
        // Include admin page
?>
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