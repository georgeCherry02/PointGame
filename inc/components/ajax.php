<?php
    $session_id_length = 32;
    $c_strong = TRUE;
    $token = bin2hex(openssl_random_pseudo_bytes($session_id_length, $c_strong));
    $_SESSION["ajax_token"] = $token;
?>
<script>
    const AJAX_TOKEN = "<?php echo $token; ?>";
</script>