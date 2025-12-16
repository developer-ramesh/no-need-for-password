# No Need For Password 🔐

Passwordless login and registration for WordPress using secure email OTP.

No passwords. No reset links. Just enter your email and log in instantly.

---

## ✨ Features

- Email-based OTP login
- Automatic user registration
- Secure OTP with expiry
- AJAX-powered popup login
- Gutenberg & Full Site Editing compatible
- Works with Twenty Twenty-Three
- Optional ACF user field support
- Lightweight & dependency-free

---

## 🚀 Quick Start

1. Install and activate the plugin
2. Add the login button anywhere:

[nnfp_login_button]

3. Click Login → Enter Email → Verify OTP → Done

---

## 🧱 Shortcodes

| Shortcode | Description |
|---------|-------------|
| `[nnfp_login_button]` | Login / Logout button |
| `[nnfp_login_form]` | Login container |
| `[nnfp_registration_form]` | Registration form |
| `[nnfp_register_popup_button]` | Registration popup |

---

## 🔌 ACF Integration

If Advanced Custom Fields is installed, user registration fields are automatically detected and saved to the user profile after OTP verification.

---

## 🔐 Security Notes

- OTP expires automatically
- All AJAX calls use nonces
- Input is sanitized and validated
- Uses WordPress core authentication

---

## 🧪 Tested With

- WordPress 6.8
- PHP 7.4+
- Twenty Twenty-Three
- Twenty Twenty-Four

---

## 🤝 Contributing

Pull requests and issues are welcome.

---

## 📄 License

GPL v3.0 or later  
© Ramesh Kumar

