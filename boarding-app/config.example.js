// ========================================
// CONFIGURATION FILE - EDIT AND RENAME
// ========================================
// 
// Instructions:
// 1. Copy this file: cp config.example.js config.js
// 2. Edit config.js and change ADMIN_PASSWORD
// 3. Add config.js to .gitignore
// 4. Include config.js in admin.html before admin.js
//
// NEVER commit config.js to version control!
// ========================================

// Admin login password - Change this to a secure password!
const ADMIN_PASSWORD = "CHANGE_ME";

// Optional: Email service configuration for notifications
const EMAIL_CONFIG = {
    // When implemented, set to your email service provider
    // Example: SendGrid, Firebase Cloud Functions, etc.
    enabled: false,
    provider: 'firebase-functions' // or 'sendgrid', 'mailgun', etc.
};
