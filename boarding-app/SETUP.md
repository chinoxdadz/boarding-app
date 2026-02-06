# Boarding House App - Setup & Deployment Guide

## Quick Start for Deployment

### Step 1: Configure Admin Password
```bash
cd boarding-app
cp config.example.js config.js
# Edit config.js and change ADMIN_PASSWORD to a strong password
```

### Step 2: Include Config in Admin Panel
Edit `admin.html` and add before `<script src="admin.js">`:
```html
<script src="config.js"></script>
```

### Step 3: Test Locally
1. Open http://127.0.0.1:5500/boarding-app/admin.html
2. Login with new admin password from config.js
3. Add test tenants and verify tenant login works

### Step 4: Deploy to Vercel
```bash
# Initialize Vercel (first time only)
vercel

# Deploy to production
vercel deploy --prod
```

### Step 5: Deploy Firestore Rules (Development)
```bash
# Current rules allow development testing
firebase deploy --only firestore:rules --project boarding-portal
```

## Feature Summary

### ✅ Admin Panel
- **Tenants**: Add, edit, remove tenants
- **Billing**: Create bills, view payment status
- **Meter Readings**: Track water & electric consumption
- **Tickets**: Manage support requests
- **Announcements**: Post and delete announcements

### ✅ Tenant Portal
- **Dashboard**: View latest announcements and bills
- **Announcements**: Read all house announcements
- **Tickets**: Submit support requests and track status
- **Billing**: 
  - View all bills (paid & unpaid)
  - See GCash payment instructions
  - View payment schedule (due dates)
  - Download payment receipts
- **Notifications**: Alerts for bills due and new announcements

### ✅ Security Features
- Password-protected admin login
- PIN-based tenant authentication
- 30-minute session timeout
- Rate limiting (5 failed attempts → 15 min lockout)
- XSS protection via input sanitization
- Content Security Policy headers

## Files You Need to Know

| File | Purpose | Action |
|------|---------|--------|
| `config.example.js` | Password template | **Copy to config.js & customize** |
| `config.js` | Admin password | **DO NOT commit to git** |
| `admin.html` | Admin panel | Add script tag for config.js |
| `index.html` | Tenant portal | No changes needed |
| `firestore.rules` | DB access rules | Current: development mode |
| `DEPLOYMENT.md` | Checklist | Full deployment guide |

## Security Reminders

⚠️ **BEFORE GOING LIVE**:
1. Change admin password from default
2. Add `config.js` to `.gitignore`
3. Do NOT commit `config.js` to version control
4. Update GCash account number in `payment.js`

## Testing Checklist

- [ ] Admin can login with new password
- [ ] Tenant "Ken" can login with Room 1, PIN 0329
- [ ] Can add new tenant in admin
- [ ] Can create bill for tenant
- [ ] Tenant sees bill in portal
- [ ] Tenant gets notification for unpaid bill
- [ ] Tenant can download receipt
- [ ] Can post and delete announcements
- [ ] Announcements appear for tenants
- [ ] Session timeout works (30 minutes)
- [ ] Rate limiting blocks after 5 failed logins

## Current Test Users

```
ADMIN:
Password: BH@dm!n2026#Secure (Change this!)

TENANTS:
Room: 1
PIN: 0329
Name: Ken
```

## Vercel Deployment

Your app is already configured for Vercel:
```bash
vercel deploy --prod  # Deploy to production domain
```

Live URL will be provided by Vercel after deployment.

## Firebase Console

Monitor your data and rules at:
https://console.firebase.google.com/project/boarding-portal/

## Support

For issues during deployment, check:
1. Browser console (F12) for JavaScript errors
2. Firebase console for data/rules errors
3. Vercel dashboard for deployment errors

---
**Status**: Ready for Testing & Deployment
**Last Updated**: February 6, 2026
