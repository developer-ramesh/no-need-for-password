<?php
/** 
 * Plugin Name: No Need For Password
 * Description: Password less login & registration via email OTP
 * Plugin URI: https://github.com/developer-ramesh
 * Author: Ramesh Kumar
 * Author URI: https://in.linkedin.com/in/developer-ramesh
 * Version: 1.0.0
 * Tested up to: 6.8
 * License: GNU General Public License v3.0
 */
if (!defined('ABSPATH')) exit;

class NNFP_Plugin {
    public function __construct() {
        add_action('init', [$this, 'start_session']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_files']);
        add_shortcode('nnfp_login_button', [$this, 'login_button']);
        add_shortcode('nnfp_login_form', [$this, 'login_page']);
        add_shortcode('nnfp_registration_form', [$this, 'registration_form']);
        add_shortcode('nnfp_register_popup_button', [$this, 'register_button_popup']);
        add_action('wp_ajax_nopriv_nnfp_get_acf_registration_form', [$this, 'ajax_load_acf_form']);
        add_action('wp_ajax_nnfp_get_acf_registration_form', [$this, 'ajax_load_acf_form']);
        add_action('wp_ajax_nopriv_nnfp_send_otp', [$this, 'ajax_send_otp']);
        add_action('wp_ajax_nnfp_send_otp', [$this, 'ajax_send_otp']);
        add_action('wp_ajax_nopriv_nnfp_verify_otp', [$this, 'ajax_verify_otp']);
        add_action('wp_ajax_nnfp_verify_otp', [$this, 'ajax_verify_otp']);
        add_action('wp_ajax_nopriv_nnfp_resend_otp', [$this, 'ajax_resend_otp']);
        add_action('wp_ajax_nnfp_resend_otp', [$this, 'ajax_resend_otp']);
        add_filter( 'render_block', [ $this, 'inject_login_into_first_navigation_only' ], 9, 2 );

    }
    public function start_session() {
        if (!session_id()) session_start();
    }
    public function enqueue_files() {
        wp_enqueue_style('nnfp-style', plugin_dir_url(__FILE__) . 'assets/css/nnfp-style.css');
        wp_enqueue_script('nnfp-script', plugin_dir_url(__FILE__) . 'assets/js/nnfp-script.js', ['jquery'], false, true);
        wp_localize_script('nnfp-script', 'nnfp_data', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('nnfp_nonce')
        ]);
    }
    public function login_button() {
        if ( is_user_logged_in() ) {

            $logout_url = wp_logout_url( home_url() );
            return '<a href="'. esc_url( $logout_url ) .'" class="nnfp-logout-link">Logout</a>';

        } else {
            
            return '<button class="nnfp-open-login">Login</button>';

        }
    }

    public function login_page() {
        return '<div id="nnfp-page-login"></div>';
    }

    public function registration_form() {
        ob_start(); ?>

        <div class="nnfp-inline-wrap">
            <h3 class="nnfp-title">Registration</h3>
            <label>Email<span class="nnfp-required-field">*</span></label>
            <input type="email" class="nnfp-input nnfp-register-email" placeholder="Enter Email" />

            <?php
            if (function_exists('acf_form')) {

                // Auto-fetch all user registration ACF groups
                $field_groups = acf_get_field_groups(array(
                    'user_form' => 'register',
                ));

                if (!empty($field_groups)) {
                    acf_form(array(
                        'post_id'      => 'user_0',
                        'field_groups' => wp_list_pluck($field_groups, 'ID'),
                        'form'         => false
                    ));
                }
            }
            ?>

            <button class="nnfp-btn nnfp-send-register-otp">Submit</button>
            <div class="nnfp-register-status"></div>

        </div>

        <?php
        return ob_get_clean();
    }

    public function register_button_popup() {
        return '<button class="nnfp-open-register-popup">Registration</button>';
    }



    public function ajax_load_acf_form() {

        check_ajax_referer('nnfp_nonce', 'nonce');

        if (!function_exists('acf_form')) {
            wp_send_json_error(['html' => '<p>ACF not installed.</p>']);
        }

        // auto-detect ACF user registration fields
        $field_groups = acf_get_field_groups(['user_form' => 'register']);

        ob_start();
        if (!empty($field_groups)) {
            acf_form([
                'post_id'        => 'user_0',
                'field_groups'   => wp_list_pluck($field_groups, 'ID'),
                'form'           => false
            ]);
        }
        $html = ob_get_clean();

        wp_send_json_success(['html' => $html]);
    }


    public function ajax_send_otp() {
        check_ajax_referer('nnfp_nonce', 'nonce');
        $email = sanitize_email($_POST['email']);
        if (!is_email($email)) wp_send_json_error('Invalid email');

        // Create user with default WP role
        if (!email_exists($email)) {
            $user_id = wp_create_user($email, wp_generate_password(), $email);

            if (!is_wp_error($user_id)) {
                $default_role = get_option('default_role', 'subscriber');
                $user = new WP_User($user_id);
                $user->set_role($default_role);
            }
        }

        $code = rand(100000, 999999);
        $_SESSION['nnfp_otp'] = $code;
        $_SESSION['nnfp_email'] = $email;
        $_SESSION['nnfp_expire'] = time() + 60;
        
        // Load email template
        ob_start();
        $otp = $code;
        $email_to = $email;
        include plugin_dir_path(__FILE__) . 'assets/template/email-template.php';
        $message = ob_get_clean();

        wp_mail($email_to, 'Your OTP Code', $message, ['Content-Type: text/html; charset=UTF-8']);

        wp_send_json_success(['seconds_left' => 60]);
    }
    public function ajax_verify_otp() {
        check_ajax_referer('nnfp_nonce', 'nonce');
        $input = sanitize_text_field($_POST['code']);
        if (isset($_SESSION['nnfp_otp'], $_SESSION['nnfp_email'], $_SESSION['nnfp_expire']) && time() < $_SESSION['nnfp_expire'] && $input === strval($_SESSION['nnfp_otp'])) {
            $user = get_user_by('email', $_SESSION['nnfp_email']);
            wp_set_auth_cookie($user->ID, true);

            // Save ACF fields
            if (isset($_POST['acf']) && is_array($_POST['acf'])) {
                foreach ($_POST['acf'] as $field_key => $value) {
                    update_field($field_key, $value, 'user_' . $user->ID);
                }
            }

            wp_send_json_success();
        }
        wp_send_json_error('Invalid or expired OTP');
    }
    public function ajax_resend_otp() { $this->ajax_send_otp(); }
    
    public function inject_login_into_first_navigation_only( $block_content, $block ) {

        static $done = false;
    
        if ( $done || is_admin() ) {
            return $block_content;
        }
    
        if ( $block['blockName'] !== 'core/navigation' ) {
            return $block_content;
        }
    
        // Ensure this is a real navigation list
        if ( strpos( $block_content, '<ul' ) === false ) {
            return $block_content;
        }
    
        // Prevent duplicate injection
        if ( strpos( $block_content, 'nnfp-login-item' ) !== false ) {
            $done = true;
            return $block_content;
        }
    
        $done = true;
    
        $item = is_user_logged_in()
            ? '<li class="wp-block-navigation-item nnfp-login-item">
                  <a href="' . esc_url( wp_logout_url( home_url() ) ) . '">Logout</a>
               </li>'
            : '<li class="wp-block-navigation-item nnfp-login-item">
                  <a href="#" class="nnfp-open-login">Login</a>
               </li>';
    
        // Insert before closing </ul>
        return preg_replace(
            '/(<\/ul>)/',
            $item . '$1',
            $block_content,
            1
        );
    }
    
    
    
    
    
    
}
new NNFP_Plugin();
