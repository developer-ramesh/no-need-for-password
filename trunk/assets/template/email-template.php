<?php
/**
 * Code Email Template
 * Variables passed: $otp (string), $email (string)
 */
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your Code</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; }
        .nnfp-container { max-width: 600px; margin: 0 auto; background-color: #f7f7f7; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);border: 1px solid #efefef; text-align: center;}
        .nnfp-container h1{ margin: 3px 0; }
        .nnfp-container h5{ margin: 0; }
        .otp-code { font-size: 28px; font-weight: bold; color: #333; margin: 20px 0; text-align: center; border-radius: 20px; padding: 30px 0; background: #fff;}
        .nnfp-container .footer { font-size: 14px; color: #666; margin-top: 30px; text-align: center; padding: 4px; border-top: 1px solid #eaeaea;}
    </style>
</head>
<body>
    <div class="nnfp-container">
        <h2>Hello</h2>
        <h5><?php echo esc_html($email); ?></h5>
        <p>You have successfully started the login process. Please enter the login code you received into the current browser window to complete the process</p>
        <div class="otp-code"><?php echo esc_html($otp); ?></div>
        <p>This Code is valid for 1 minute. Please do not share it with anyone.</p>
        <div class="footer">If you didn't request for this Code, you can ignore this email.</div>
    </div>
</body>
</html>
