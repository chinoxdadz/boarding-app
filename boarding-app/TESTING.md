# Testing & Troubleshooting Guide

## Pre-Deployment Testing Checklist

### Admin Panel Tests

#### Login
- [ ] Default password works: `BH@dm!n2026#Secure`
- [ ] Wrong password shows error
- [ ] Rate limiting works (5 failed attempts lock for 15 min)
- [ ] Session timeout works (30 minutes inactivity)

#### Tenant Management
- [ ] Can add new tenant (Name, Room, PIN)
- [ ] PIN must be exactly 4 digits
- [ ] Room number format flexibility works (1, Room 1, Room 1, room-1)
- [ ] Duplicate room numbers are rejected
- [ ] Can edit existing tenant
- [ ] Can delete tenant

#### Billing
- [ ] Can add meter readings (water, electric, date)
- [ ] Can create bill from readings
- [ ] Automatic calculation works:
  - Water consumption × ₱50
  - Electric consumption × ₱12
  - Plus manual rental amount
  - = Total amount due
- [ ] Can mark bill as paid/unpaid
- [ ] Bill due date displays correctly

#### Tickets
- [ ] Can view all open tickets
- [ ] Tickets show room number and description
- [ ] Can mark ticket as resolved

#### Announcements
- [ ] Can post announcement
- [ ] Announcement appears in list
- [ ] Can delete announcement
- [ ] Title and body display correctly

### Tenant Portal Tests

#### Login
- [ ] Can login with Room: 1, PIN: 0329 (test user "Ken")
- [ ] Invalid room shows error
- [ ] Invalid PIN shows error
- [ ] Rate limiting works (5 failed attempts)
- [ ] Correct login shows dashboard

#### Dashboard
- [ ] Latest announcements display
- [ ] Latest bill shows amount and status
- [ ] Quick action buttons work

#### Announcements
- [ ] All announcements display
- [ ] Newest appear first
- [ ] Clickable and readable

#### Tickets
- [ ] Can submit new ticket
- [ ] Category dropdown works (Maintenance, WiFi, Billing, Noise, Other)
- [ ] Message field validates (min 10 chars)
- [ ] Ticket appears in history
- [ ] Shows submission date

#### Billing
- [ ] Payment method (GCash) displays with account info
- [ ] Payment schedule shows upcoming unpaid bills with due dates
- [ ] Shows bill amount for each due date
- [ ] Billing history shows all bills (paid and unpaid)
- [ ] Status badge shows "Paid" or "Unpaid"
- [ ] Breakdown shows Rental, Water, Electric amounts
- [ ] Payment receipt section shows only paid bills
- [ ] Can download receipt (downloads as text file)
- [ ] Downloaded receipt includes:
  - Room number
  - Bill month
  - Itemized breakdown (Rental, Water, Electric)
  - Total amount
  - Status
  - Due date

#### Notifications
- [ ] Notification bell appears in header
- [ ] Badge shows unread count (if > 0)
- [ ] Click bell goes to notifications view
- [ ] All notifications display
- [ ] Can filter by type (All, Bills, Announcements)
- [ ] Can mark individual as read
- [ ] Can delete notification
- [ ] Can clear all notifications
- [ ] Bill notifications show amount and due date
- [ ] Announcement notifications show title and excerpt
- [ ] Timestamps show "5m ago", "2h ago", etc.

### Cross-Browser Tests

Test on:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Mobile Tests

- [ ] Header navigation accessible
- [ ] Sidebar collapses properly
- [ ] Buttons are touch-friendly (44x44px minimum)
- [ ] Tables scroll horizontally
- [ ] Forms are readable without zoom
- [ ] Input fields don't trigger unwanted zoom (16px font)
- [ ] Modal dialogs fit on screen
- [ ] Mobile navigation bar accessible

### Responsive Tests

Test at widths:
- [ ] 320px (mobile)
- [ ] 480px (mobile large)
- [ ] 768px (tablet)
- [ ] 1024px (desktop)
- [ ] 1440px (desktop large)

## Common Issues & Solutions

### Tenant Can't Login

**Symptoms**: Login fails with "Invalid Room Number or PIN"

**Solutions**:
1. Verify exact room number and PIN in Firestore admin console
2. Try without "Room" prefix (e.g., just "1" instead of "Room 1")
3. Check PIN is exactly 4 digits
4. Clear browser cache (Ctrl+Shift+Delete)
5. Check firestore.rules allow reads

**Debug**: Check browser console (F12) for error messages

### Admin Password Wrong

**Symptoms**: Admin login always fails

**Solutions**:
1. Check you copied config.js correctly from config.example.js
2. Check ADMIN_PASSWORD value in config.js matches what you're typing
3. Look for extra spaces: `"password "` ≠ `"password"`
4. Restart browser to reload config.js
5. Verify config.js is loaded (check Sources tab in DevTools)

### Bills Not Showing in Tenant View

**Symptoms**: Tenant login works but "No billing history"

**Solutions**:
1. Create bill via admin panel
2. Verify bill roomNo exactly matches tenant's room number
3. Bill should be in `soas` collection in Firestore
4. Check firestore.rules allow reads

### Notifications Not Working

**Symptoms**: Notification badge never appears, no alerts

**Solutions**:
1. Allow browser notification permission when prompted
2. Check notification toggle in browser settings
3. Create new bill or announcement as admin
4. Wait 30 seconds for auto-refresh (or refresh page manually)
5. Check browser console for errors

### Forms Not Submitting

**Symptoms**: Click submit but nothing happens

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify all required fields filled
3. Check Firestore rules allow writes
4. Verify Firebase is connected

### Session Timeout Too Aggressive

**Symptoms**: Getting logged out unexpectedly

**Solutions**:
1. Current timeout: 30 minutes of inactivity
2. To change: Edit Security.session.timeout in security.js
3. Default is 30 * 60 * 1000 milliseconds
4. Move mouse or type to reset timer

## Firebase Console Checks

Access: https://console.firebase.google.com/project/boarding-portal/

### Verify Data Exists
1. Go to Firestore Database
2. Check collections:
   - `tenants`: Should have test tenant (Ken, Room 1)
   - `soas`: Should have test bills
   - `announcements`: Optional test announcements
   - `meter_readings`: Optional meter data
   - `tickets`: Should have ticket collection

### Verify Rules
1. Go to Firestore Rules
2. Should match current firestore.rules file
3. For development: Should have `allow read, write: if true;`
4. For production: Should be restrictive

### Monitor Errors
1. Go to Firestore Logs (or Cloud Logging)
2. Check for read/write errors
3. Verify rate limiting not triggered

## Performance Checks

- [ ] Page loads in < 3 seconds
- [ ] Notifications update every 30 seconds
- [ ] Session timeout works at 30 minutes
- [ ] No console errors or warnings
- [ ] No memory leaks (check DevTools memory)
- [ ] Images load properly
- [ ] CSS applies without flash

## Accessibility Checks

- [ ] Can navigate with keyboard only (Tab, Enter)
- [ ] Color contrast meets WCAG standards
- [ ] Form labels associated with inputs
- [ ] Buttons have clear labels
- [ ] Modal dialogs have focus management
- [ ] Error messages are clear

## Before Going Live

- [ ] Change admin password from default
- [ ] Test with real user credentials
- [ ] Verify all tenants can access features
- [ ] Backup database (in Firebase)
- [ ] Document admin procedures
- [ ] Create user guide for tenants
- [ ] Plan support process for issues
- [ ] Monitor error logs for first week
- [ ] Get feedback from test users

## Test Data Creation Script

To quickly add test data via admin:

1. **Add Tenants**:
   - Name: Ken, Room: 1, PIN: 0329
   - Name: Maria, Room: 2, PIN: 1234
   - Name: Juan, Room: 3, PIN: 5678

2. **Add Meter Readings** (for each tenant):
   - Date: 2026-01-31, Room: 1, Water: 100, Electric: 200
   - Date: 2026-02-28, Room: 1, Water: 125, Electric: 250

3. **Create Bills**:
   - Room 1, Month: 2026-02, Rental: 5000, Due: 2026-03-10

4. **Post Announcements**:
   - Title: "Water Maintenance", Body: "Water maintenance tomorrow 2-4 PM"

---

**Last Updated**: February 6, 2026
