# Boarding House App - Deployment Checklist

## Pre-Deployment Security Checklist

### 1. ✅ Configuration & Secrets
- [ ] Copy `config.example.js` to `config.js`
- [ ] Change admin password in `config.js` to a strong password
- [ ] Add `config.js` to `.gitignore`
- [ ] Never commit secrets to version control
- [ ] Update GCash account number in `payment.js`

### 2. ✅ Firebase Security
- [ ] Review `firestore.rules` for development mode
- [ ] Plan migration to `firestore.rules.production`
- [ ] Set up Cloud Functions for all write operations (future phase)
- [ ] Enable Firebase Authentication (optional, for stronger security)
- [ ] Set Firebase rules to production when backend ready

### 3. ✅ Admin Access
- [ ] Create unique, strong admin password
- [ ] Plan password rotation policy (change monthly recommended)
- [ ] Document who has admin access
- [ ] Setup admin audit logging (future enhancement)

### 4. ✅ Data Protection
- [ ] Enable Firestore backups
- [ ] Plan data retention policy for sensitive records
- [ ] Review what PII is collected (phone, email optional)

### 5. ✅ HTTPS & Domain
- [ ] Configure custom domain (if applicable)
- [ ] Enable HTTPS only (Vercel does this by default)
- [ ] Set security headers in deployment config

### 6. ✅ Testing
- [ ] Test admin login with new password
- [ ] Test tenant login with multiple users
- [ ] Test all CRUD operations (Create, Read, Update, Delete)
- [ ] Test notifications (bills, announcements)
- [ ] Test payment receipt downloads
- [ ] Test mobile responsiveness
- [ ] Test session timeout (30 minutes)
- [ ] Test rate limiting (5 failed attempts)

### 7. ✅ Deployment
- [ ] Run `firebase deploy --only firestore:rules`
- [ ] Deploy to Vercel: `vercel deploy`
- [ ] Verify app works on live domain
- [ ] Monitor error logs for issues

### 8. ✅ User Management
- [ ] Add first batch of tenants via admin
- [ ] Distribute login credentials securely (NOT via email)
- [ ] Create onboarding guide for tenants
- [ ] Create admin manual

## Deployment Commands

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules --project boarding-portal

# Deploy to Vercel (after vercel init)
vercel deploy --prod
```

## Current Implementation Status

### ✅ Completed Features
- Responsive design (mobile, tablet, desktop)
- Admin authentication (password-based)
- Tenant management (CRUD)
- Billing management with meter readings
- Support ticket system
- Announcements system with delete option
- Notifications center with filters
- Payment method display (GCash)
- Payment schedule calendar
- Receipt downloads (text format)
- Session security (30-min timeout)
- Rate limiting (5 attempts, 15-min lockout)
- XSS protection via sanitization
- CSP headers for security

### 🚧 For Future Enhancement
- PDF receipt generation
- Email notifications for bills
- Actual GCash payment verification
- Firebase Auth integration
- Admin audit logs
- Analytics dashboard
- Automatic bill reminders
- Payment online integration
- Chat/messaging system
- Document storage
- Lease agreement uploads

## Security Notes

### Current Architecture
- **Development Mode**: Firestore rules allow all reads/writes for testing
- **Admin Access**: Password-protected login (no Firebase Auth)
- **Tenant Access**: PIN-based verification (not cryptographically secure)
- **Session**: 30-minute inactivity timeout

### Production Considerations
1. **Upgrade Authentication**:
   - Implement Firebase Auth for stronger security
   - Use OAuth 2.0 for admin login
   - Hash/encrypt tenant PINs server-side

2. **Upgrade Data Access**:
   - Switch to production Firestore rules
   - Implement Cloud Functions for all writes
   - Add audit logging for all operations

3. **Add Missing Layers**:
   - Email verification for tenants
   - Admin password reset mechanism
   - Two-factor authentication (optional)
   - Encryption for sensitive data

## Support & Troubleshooting

### Common Issues

**Tenant Can't Login**
- Verify exact room number and PIN match Firestore
- Check firestore.rules allows reads
- Clear browser cache and retry

**Admin Password Wrong**
- Check config.js for correct password
- Ensure no extra spaces before/after password

**Bills Not Showing**
- Verify bills exist in `soas` collection
- Check room number matches tenant's room

**Notifications Not Working**
- Enable browser notification permission
- Check browser console for errors
- Verify bills/announcements exist in Firestore

## File Structure

```
boarding-app/
├── index.html              # Tenant portal
├── admin.html              # Admin panel
├── app.js                  # Tenant logic
├── admin.js                # Admin logic
├── security.js             # Security utilities
├── style.css               # Styling (responsive)
├── config.example.js       # ← COPY & CUSTOMIZE
├── payment.js              # GCash payment helper
├── manifest.json           # PWA config
├── firestore.rules         # Development rules
├── firestore.rules.production  # For future use
└── firebase.json           # Firebase config
```

## Next Steps After Launch

1. **Monitor & Maintain**
   - Check error logs weekly
   - Verify all tenants can access features
   - Collect feedback from admin and tenants

2. **Plan Phase 2**
   - Implement PDF receipts
   - Add email notifications
   - Upgrade authentication

3. **Security Audit**
   - Conduct penetration testing
   - Review access logs
   - Update security rules based on usage

---
**Last Updated**: February 6, 2026
**Status**: Ready for Internal Testing / MVP Deployment
