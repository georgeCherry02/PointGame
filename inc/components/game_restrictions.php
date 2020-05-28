<?php
    // Choose a shape at random
    $chosen_shape = Shapes::getRandom();
    $_SESSION["Expected_Shape_ID"] = $chosen_shape->getID();;
    // Fetch the game restriction set
    $restriction_set = Restrictions::generateGameSet();
    // Update SESSION to represent this
    foreach (RestrictionTypes::ALL() as $restriction) {
        $_SESSION[$restriction->getFunctionalName()] = $restriction_set[$restriction->getFunctionalName()];
    }
    // Carry it across to javascript
?>
<script>
    const EXPECTED_SHAPE_ID = <?php echo $chosen_shape->getID(); ?>;
    const MIN_RADIUS = <?php echo $_SESSION["minimum_radius"]; ?>;
    const MAX_RADIUS = <?php echo $_SESSION["maximum_radius"]; ?>;
    const MIN_NUMBER = <?php echo $_SESSION["minimum_number"]; ?>;
    const MAX_NUMBER = <?php echo $_SESSION["maximum_number"]; ?>;
</script>
