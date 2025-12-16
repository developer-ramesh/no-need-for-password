=== No Need For Password – Email OTP Login & Registration ===
Contributors: developer-ramesh
Tags: login, passwordless login, otp login, email login, user registration, security, acf supported
Requires at least: 6.0
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Passwordless login and registration using secure email OTP. No passwords to remember. Fast, simple, and user-friendly authentication for WordPress.

== Description ==

**No Need For Password** lets users log in and register using a **one-time password (OTP) sent to their email** — no traditional passwords required.

This plugin is designed for modern websites that want:
- Better user experience
- Fewer failed logins
- Reduced password-related security risks

Users simply enter their email, receive a secure OTP, and log in instantly.

Perfect for:
- Blogs
- Membership sites
- WooCommerce stores
- SaaS-style WordPress websites

No external services. No third-party APIs. Everything runs inside WordPress.

---

### 🔐 Key Features

* Passwordless login via email OTP
* Automatic user registration for new emails
* Secure OTP with expiry time
* Login popup with clean UI
* Logout link for logged-in users
* Gutenberg & Full Site Editing (FSE) compatible
* Works with block themes like Twenty Twenty-Three
* ACF support for user registration fields
* AJAX-based (no page reloads)
* Lightweight & fast
* Developer-friendly and extensible

---

### 🚀 How It Works

1. User clicks **Login**
2. Enters email address
3. Receives a 6-digit OTP by email
4. Enters OTP
5. Logged in instantly

No passwords. No reset links. No friction.

---

### 🧱 Shortcodes

Use these shortcodes anywhere on your site:

**Login button**

[nnfp_login_button]

**Login page container**

[nnfp_login_form]

**Registration popup button**

[nnfp_register_popup_button]

**Registration form**

[nnfp_registration_form]


---

### 🎨 Theme Compatibility

This plugin works with:
- Classic themes
- Block themes (Full Site Editing)
- Twenty Twenty-Three
- Twenty Twenty-Four
- Most modern WordPress themes

No theme files need to be edited.

---

### 🔌 ACF Integration (Optional)

If **Advanced Custom Fields (ACF)** is installed:
- User registration fields are automatically detected
- ACF values are saved to the user profile after OTP verification

ACF is optional — the plugin works perfectly without it.

---

### 🔒 Security

* OTP is time-limited
* Nonce protection on all AJAX requests
* Sanitized and validated user input
* Uses WordPress authentication APIs
* No passwords stored or transmitted

---

### 👨‍💻 Developer Friendly

Hooks and filters can be added easily.
Clean class-based architecture.
No hard dependencies.

---

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/`
2. Activate **No Need For Password** from the Plugins page
3. Add `[nnfp_login_button]` where you want the login button (This will also render in the top header automatically)
4. Done 🎉

---

== Frequently Asked Questions ==

= Does this replace the default WordPress login? =
No. The default `/wp-login.php` still works unless you disable it separately.

---

= Will this work with WooCommerce? =
Yes. Logged-in users behave exactly like normal WordPress users.

---

= Is email required? =
Yes. Email is used as the login identifier.

---

= Does this plugin store passwords? =
No. This plugin is completely passwordless.

---

= Can I customize the popup design? =
Yes. You can override styles via CSS.

---

= Is it GDPR-friendly? =
Yes. No third-party services or tracking is used.

---

== Screenshots ==

1. Login popup with email OTP
2. OTP verification screen
3. Logged-in user state
4. Registration form with ACF fields

---

== Changelog ==

= 1.0.0 =
* Initial release
* Passwordless login via email OTP
* Registration support
* ACF integration
* Gutenberg & FSE compatibility

---

== Upgrade Notice ==

= 1.0.0 =
First stable release.

---

== Support ==

For support, feature requests, or bug reports:
https://github.com/developer-ramesh

---

Made with ❤️ for WordPress.
