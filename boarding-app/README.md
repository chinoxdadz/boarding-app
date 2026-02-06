# 🏠 Boarding House Management System

A modern, responsive web application for managing boarding house operations, tenant information, billing, and communications.

## 🎯 Features

### Admin Panel
- **Dashboard**: KPI metrics (occupied rooms, bills due, open tickets)
- **Tenant Management**: Add, edit, remove tenants with PIN credentials
- **Billing System**: Automated calculation of water/electric usage + rental fees
- **Meter Readings**: Track consumption monthly
- **Support Tickets**: Manage tenant maintenance requests
- **Announcements**: Post and manage house announcements
- **Responsive Design**: Works on desktop, tablet, and mobile

### Tenant Portal
- **Dashboard**: Quick view of latest announcements and bills
- **Announcements**: Read all house communications
- **Support Tickets**: Submit and track maintenance requests
- **Billing Management**:
  - View payment history (paid/unpaid)
  - GCash payment instructions
  - Payment schedule calendar
  - Download receipts
- **Notifications**: Real-time alerts for bills and announcements
- **Responsive Design**: Optimized for all devices

## 🔒 Security

- Password-protected admin login
- PIN-based tenant authentication
- 30-minute session timeout with auto-logout
- Rate limiting: 5 failed login attempts = 15-minute lockout
- XSS protection via input sanitization
- Content Security Policy headers
- FireStore access control rules

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ (for local development)
- Firebase project (already configured)
- Vercel account (optional, for hosting)

### Local Development

1. **Start local server**:
   ```bash
   cd boarding-app
   python -m http.server 5500
   # or: npx http-server -p 5500
   ```

2. **Access the app**:
   - Admin: http://localhost:5500/boarding-app/admin.html
   - Tenant: http://localhost:5500/boarding-app/index.html

### Configure Admin Password

1. Copy configuration template:
   ```bash
   cp config.example.js config.js
   ```

2. Edit `config.js` and set a strong admin password:
   ```javascript
   const ADMIN_PASSWORD = "YourSecurePassword123!";
   ```

3. **Never commit** `config.js` to version control (already in .gitignore)

## 📦 Project Structure

```
boarding-app/
├── index.html              # Tenant portal
├── admin.html              # Admin panel
├── app.js                  # Tenant logic
├── admin.js                # Admin logic  
├── security.js             # Security utilities
├── style.css               # Responsive styling
├── config.example.js       # Password configuration template
├── payment.js              # GCash payment helper
├── firestore.rules         # Database access rules
├── manifest.json           # PWA configuration
├── firebase.json           # Firebase config
├── SETUP.md                # Setup instructions
├── DEPLOYMENT.md           # Deployment checklist
└── README.md               # This file
```

## 💳 Payment Integration

The app includes GCash payment method configuration:
- Payment instructions displayed to tenants
- Reference code generation for transactions
- Receipt download functionality
- Ready for API integration when needed

Edit `payment.js` to update GCash account details.

## 📊 Database Schema

### Collections
- **tenants**: User accounts with PIN credentials
- **soas**: Billing statements (water, electric, rental)
- **meter_readings**: Monthly consumption data
- **tickets**: Support requests
- **announcements**: House communications

## 🎨 Design Features

- **Mobile-First**: Optimized for small screens first
- **Responsive Breakpoints**: 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Touch-Friendly**: Large buttons and tap targets on mobile
- **Accessibility**: Semantic HTML, ARIA labels, color contrast
- **Dark/Light**: Uses CSS variables for easy theming

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔄 Notification System

- Real-time notification badge with unread count
- Bill due alerts with days remaining
- New announcement notifications
- Browser push notifications (with user permission)
- Notification history and filtering
- Auto-refresh every 30 seconds

## 🐛 Troubleshooting

### Tenant Can't Login
- Verify room number and PIN match exactly
- Check that tenant exists in Firestore
- Clear browser cache and retry
- Check firestore.rules allow reads

### Admin Password Wrong
- Confirm you're using correct password from config.js
- Check for extra spaces in config file
- Restart browser/clear cache

### Bills Not Showing
- Create bill via admin panel
- Verify bill roomNo matches tenant's room number
- Check firestore.rules

### Notifications Not Working
- Allow browser notification permission when prompted
- Check browser console for JavaScript errors
- Verify bills/announcements exist in Firestore

## 📝 Default Test Credentials

After setup, you can test with:
```
Admin Panel:
- URL: /boarding-app/admin.html
- Default Password: BH@dm!n2026#Secure (CHANGE THIS!)

Tenant Portal (sample):
- Room: 1
- PIN: 0329
```

## 🚀 Deployment

### To Vercel
```bash
vercel deploy --prod
```

### To Firebase Hosting
```bash
firebase deploy --only hosting --project boarding-portal
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete checklist.

## 🔐 Security Notes

### Current Implementation (Development)
- Firestore rules allow all reads/writes for development testing
- Admin password stored in config.js
- Tenant PIN stored in plain text (not production-safe)

### Before Production
- Migrate to proper Firebase authentication
- Implement Cloud Functions for all data writes
- Update Firestore rules to restrictive production rules
- Encrypt sensitive data at rest
- Enable HTTPS only (automatic on Vercel)
- Add email verification for tenants
- Implement password reset mechanism

See [DEPLOYMENT.md](DEPLOYMENT.md) for production migration guide.

## 📞 Support

### For Setup Help
- Check [SETUP.md](SETUP.md) for configuration guide
- Review [DEPLOYMENT.md](DEPLOYMENT.md) before going live

### For Issues
1. Check browser console (F12) for errors
2. Review Firebase console at console.firebase.google.com
3. Check Vercel dashboard if deployed

## 📄 License

This project is proprietary software. Unauthorized copying is prohibited.

## ✨ Future Enhancements

- [ ] PDF receipt generation
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Actual GCash payment verification
- [ ] Online payment integration
- [ ] Document/lease storage
- [ ] Chat/messaging system
- [ ] Analytics & reports
- [ ] API for mobile apps
- [ ] Multi-property support

---

**Version**: 1.0.0  
**Last Updated**: February 6, 2026  
**Status**: Ready for Testing & Deployment  
**Maintainer**: Development Team
