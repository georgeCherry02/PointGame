<?php
    include_once "../inc/base.php";

    $page_title = "Home";
    include_once "../inc/components/header.php";
    include_once "../inc/components/navbar.php";
?>
<div class="landing jumbotron white-background">
    <div class="landing-circle-1"></div>
    <div class="landing-circle-2"></div>
</div>
<div class="container">
    <h4 class="grey-text">Hi, welcome to "What's The Point?"!</h4>
    <p class="grey-text">We're a citizen science initiative looking to develop new mathematical techniques to automatically identify shape and structure in datasets of point patterns. This is something that humans can easily do, yet currently computers struggle to do accurately. Interpreting spatial patterns in these datasets is crucial for improving our understanding of problems in a huge range of areas, including describing the clustering of immune cells within tumours, the structure of neurons in the brain, and the way that information can be interpreted by computers more generally.</p>
    <p class="grey-text">By playing our game you can help us form large datasets of labelled point patterns, in turn allowing us to develop new mathematical descriptions of point data with all the benefits as described above! So, play away!</p>
    <a href="game.php">
        <button type="button" class="btn btn-primary highlight-background highlight-border">Play!</button>
    </a>
</div>
<?php
    include_once "../inc/components/footer.php";
?>