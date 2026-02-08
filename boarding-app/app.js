// ==================== CONFIGURATION ====================
const firebaseConfig = {
  apiKey: "AIzaSyAtzL7jEhQhtfxbEMxFmttcDA7GLCh1d7g",
  authDomain: "boarding-portal.firebaseapp.com",
  projectId: "boarding-portal",
  storageBucket: "boarding-portal.firebasestorage.app",
  messagingSenderId: "303774773682",
  appId: "1:303774773682:web:1ee0a3c98793c8ab7cb4ab"
};

// Initialize Firebase (Using the global variables from script tags)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Helper to handle Firestore Timestamps or plain Date objects
function formatDate(ts) {
    if (!ts) return 'Just now';
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    return new Date(ts).toLocaleDateString();
}

function normalizeRoomNo(roomNo) {
    return String(roomNo)
        .trim()
        .replace(/^room\s*/i, '')
        .replace(/\s+/g, '')
        .toLowerCase();
}

// ==================== STATE MANAGEMENT ====================
const app = {
    user: null, // Stores { roomNo, pin, ... }
    history: [], // Navigation history
    _lastBills: [],
    
    // Initialize App
    init: () => {
        app.applyTheme();
        const storedUser = localStorage.getItem('bh_tenant');
        if (storedUser) {
            app.user = JSON.parse(storedUser);
            app.showApp();
        } else {
            app.showLogin();
        }
    },

    applyTheme: () => {
        const theme = localStorage.getItem('bh_theme') || 'dark';
        document.body.classList.toggle('theme-light', theme === 'light');
        app.updateThemeButton(theme);
    },

    toggleTheme: () => {
        const isLight = document.body.classList.contains('theme-light');
        const next = isLight ? 'dark' : 'light';
        localStorage.setItem('bh_theme', next);
        app.applyTheme();
    },

    updateThemeButton: (theme) => {
        const btn = document.getElementById('tenant-theme-toggle');
        if (btn) {
            btn.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
        }
    },

    // Navigation Router
    nav: (screen) => {
        // Add to history if not going back
        if (app.history[app.history.length - 1] !== screen) {
            app.history.push(screen);
        }
        
        // Update sidebar active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-view="${screen}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Update page title
        const titleMap = {
            'home': 'Dashboard',
            'announcements': 'Announcements',
            'tickets': 'Support Tickets',
            'billing': 'Billing Statements',
            'notifications': 'Notifications'
        };
        const pageTitle = document.getElementById('tenant-page-title');
        if (pageTitle) {
            pageTitle.textContent = titleMap[screen] || 'Dashboard';
        }
        
        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        
        // Show selected view
        const target = document.getElementById(`${screen}-view`);
        if (target) {
            target.classList.remove('hidden');
            app.loadData(screen); // Fetch data for this screen
        }
        
        // Show/hide back button
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            if (screen === 'home' || app.history.length <= 1) {
                backBtn.classList.add('hidden');
            } else {
                backBtn.classList.remove('hidden');
            }
        }
    },
    
    // Back navigation
    back: () => {
        // Remove current view from history
        if (app.history.length > 1) {
            app.history.pop();
            // Get previous view
            const previousView = app.history[app.history.length - 1] || 'home';
            // Navigate without adding to history again
            app.history.pop(); // Remove it temporarily
            app.nav(previousView);
        } else {
            app.nav('home');
        }
    },

    // ==================== AUTHENTICATION ====================
    login: async (e) => {
        e.preventDefault();
        
        const roomInput = document.getElementById('login-room').value;
        const pinInput = document.getElementById('login-pin').value;
        const errorMsg = document.getElementById('login-error');

        errorMsg.innerText = "";

        try {
            // Validate and sanitize inputs
            const room = Security.validateRoomNo(roomInput);
            const pin = Security.validatePin(pinInput);
            
            // Check rate limiting
            Security.rateLimiter.canAttempt(room);

            // Clear previous errors
            errorMsg.innerText = "Checking credentials...";

            // Check Firestore for matching Room AND PIN
            // WARNING: This is NOT secure! PINs should be hashed server-side
            // For production, use Firebase Authentication or Cloud Functions
            const roomNormalized = normalizeRoomNo(room);

            const tryMatch = async (field, value) => {
                const snap = await db.collection('tenants')
                    .where(field, '==', value)
                    .limit(1)
                    .get();
                if (snap.empty) return null;
                const doc = snap.docs[0];
                const data = doc.data();
                return (String(data.pin || '') === String(pin)) ? { id: doc.id, data } : null;
            };

            let match = await tryMatch('roomNoNormalized', roomNormalized);
            if (!match) match = await tryMatch('roomNo', room);
            if (!match) match = await tryMatch('roomNo', `Room ${room}`);
            if (!match) match = await tryMatch('roomNo', `Room${room}`);

            if (match) {
                Security.rateLimiter.recordAttempt(room, true);
                const roomValue = match.data.roomNo || room;
                app.user = { roomNo: roomValue };
                
                // Store with timestamp for session management
                const sessionData = {
                    roomNo: roomValue,
                    loginTime: Date.now()
                };
                localStorage.setItem('bh_tenant', JSON.stringify(sessionData));
                
                app.showApp();
                document.getElementById('login-form').reset();
            } else {
                Security.rateLimiter.recordAttempt(room, false);
                errorMsg.innerText = "Invalid Room Number or PIN.";
                
                // Clear password field on failed attempt
                document.getElementById('login-pin').value = '';
            }
        } catch (err) {
            if (err.message.includes('Too many failed attempts')) {
                errorMsg.innerText = err.message;
            } else if (err.message.includes('Invalid')) {
                errorMsg.innerText = err.message;
            } else {
                console.error("Login Error:", err);
                errorMsg.innerText = "Login error. Please try again.";
            }
        }
    },

    logout: () => {
        localStorage.removeItem('bh_tenant');
        app.user = null;
        window.location.reload();
    },

    showLogin: () => {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    },

    showApp: () => {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        app.nav('home'); // Load dashboard by default
        if (typeof Security !== 'undefined' && Security.session && Security.session.updateActivity) {
            Security.session.updateActivity();
        }
        app.initNotifications();
        app.requestNotificationPermission();
        app.updateNotificationBadge();
    },

    // ==================== DATA FETCHING ====================
    loadData: (screen) => {
        if (screen === 'home') {
            app.fetchHomeData();
        } else if (screen === 'announcements') {
            app.fetchAnnouncements();
        } else if (screen === 'tickets') {
            app.fetchTickets();
        } else if (screen === 'billing') {
            app.fetchBilling();
        } else if (screen === 'notifications') {
            app.fetchNotifications();
        }
    },

    // ==================== NOTIFICATIONS ====================
    notifications: {
        list: [],
        filtered: [],
        currentFilter: 'all'
    },

    normalizeNotificationTimestamps: (list) => {
        return (list || []).map(n => ({
            ...n,
            timestamp: n?.timestamp ? new Date(n.timestamp) : new Date()
        }));
    },

    pruneNotifications: () => {
        const maxItems = 50;
        const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
        const cutoff = Date.now() - maxAgeMs;

        app.notifications.list = app.notifications.list.filter(n => {
            const ts = n?.timestamp ? new Date(n.timestamp).getTime() : 0;
            return ts && ts >= cutoff;
        });

        app.notifications.list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (app.notifications.list.length > maxItems) {
            app.notifications.list = app.notifications.list.slice(0, maxItems);
        }
    },

    initNotifications: async () => {
        app.checkForNewNotifications();
        // Check for notifications every 30 seconds
        setInterval(app.checkForNewNotifications, 30000);
    },

    checkForNewNotifications: async () => {
        if (!app.user) return;
        
        try {
            const now = new Date();
            const lastCheck = localStorage.getItem('bh_last_notification_check');
            const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(0);
            
            // Check for unpaid bills
            const billsSnap = await db.collection('soas')
                .where('roomNo', '==', app.user.roomNo)
                .where('status', '==', 'unpaid')
                .get();
            
            billsSnap.forEach(doc => {
                const bill = doc.data();
                const notificationId = `bill-${doc.id}`;
                
                if (!app.notifications.list.find(n => n.id === notificationId)) {
                    const daysUntilDue = Math.ceil((new Date(bill.dueDate) - now) / (1000 * 60 * 60 * 24));
                    
                    app.notifications.list.unshift({
                        id: notificationId,
                        type: 'bill',
                        title: `📊 Bill Due: Room ${bill.roomNo}`,
                        message: `₱${bill.totalAmount.toFixed(2)} due on ${bill.dueDate}${daysUntilDue <= 3 && daysUntilDue > 0 ? ' (in ' + daysUntilDue + ' days)' : ''}`,
                        timestamp: new Date(),
                        read: false,
                        data: { billId: doc.id, roomNo: bill.roomNo, amount: bill.totalAmount }
                    });
                    
                    app.sendBrowserNotification('📊 Bill Due', `₱${bill.totalAmount.toFixed(2)} due on ${bill.dueDate}`);
                }
            });
            
            // Check for new announcements
            const announcementsSnap = await db.collection('announcements')
                .where('createdAt', '>', new firebase.firestore.Timestamp(Math.floor(lastCheckDate / 1000), 0))
                .get();
            
            announcementsSnap.forEach(doc => {
                const ann = doc.data();
                const notificationId = `ann-${doc.id}`;
                
                if (!app.notifications.list.find(n => n.id === notificationId)) {
                    app.notifications.list.unshift({
                        id: notificationId,
                        type: 'announcement',
                        title: `📢 ${Security.sanitizeText(ann.title)}`,
                        message: Security.sanitizeText(ann.body).substring(0, 100),
                        timestamp: new Date(ann.createdAt.seconds * 1000),
                        read: false,
                        data: { announcementId: doc.id }
                    });
                    
                    app.sendBrowserNotification('📢 New Announcement', Security.sanitizeText(ann.title));
                }
            });

            app.pruneNotifications();
            localStorage.setItem('bh_last_notification_check', now.toISOString());
            localStorage.setItem('bh_notifications', JSON.stringify(app.notifications.list));
            app.updateNotificationBadge();
            
        } catch (e) {
            console.error('Error checking notifications:', e);
        }
    },

    fetchNotifications: async () => {
        const container = document.getElementById('notifications-list');
        container.innerHTML = 'Loading notifications...';
        
        // Load from localStorage first
        const stored = localStorage.getItem('bh_notifications');
        if (stored) {
            app.notifications.list = app.normalizeNotificationTimestamps(JSON.parse(stored));
            app.pruneNotifications();
        }
        
        app.filterNotifications(app.notifications.currentFilter);
    },

    filterNotifications: (filter) => {
        app.notifications.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('[id^="filter-"]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`filter-${filter}`).classList.add('active');
        
        // Filter notifications
        if (filter === 'all') {
            app.notifications.filtered = [...app.notifications.list];
        } else {
            app.notifications.filtered = app.notifications.list.filter(n => n.type === filter);
        }
        
        app.renderNotifications();
    },

    renderNotifications: () => {
        const container = document.getElementById('notifications-list');
        
        if (app.notifications.filtered.length === 0) {
            container.innerHTML = `
                <div class="notification-empty">
                    <p style="font-size: 2rem;">🔕</p>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        app.notifications.filtered.forEach(notification => {
            const timeAgo = app.getTimeAgo(notification.timestamp);
            const unreadClass = notification.read ? '' : 'unread';
            
            html += `
                <div class="notification-item ${notification.type} ${unreadClass}" data-notification-id="${notification.id}">
                    <div class="notification-header">
                        <h4 class="notification-title">${notification.title}</h4>
                        <span class="notification-type ${notification.type}">${notification.type}</span>
                    </div>
                    <p class="notification-message">${notification.message}</p>
                    <div class="notification-footer">
                        <span class="notification-time">${timeAgo}</span>
                        <div class="notification-actions">
                            ${!notification.read ? `<button class="notification-btn" onclick="app.markNotificationAsRead('${notification.id}')">Mark as read</button>` : ''}
                            <button class="notification-btn" onclick="app.deleteNotification('${notification.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },

    markNotificationAsRead: (notificationId) => {
        const notification = app.notifications.list.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            localStorage.setItem('bh_notifications', JSON.stringify(app.notifications.list));
            app.renderNotifications();
            app.updateNotificationBadge();
        }
    },

    deleteNotification: (notificationId) => {
        app.notifications.list = app.notifications.list.filter(n => n.id !== notificationId);
        localStorage.setItem('bh_notifications', JSON.stringify(app.notifications.list));
        app.fetchNotifications(); // Re-render
        app.updateNotificationBadge();
    },

    clearAllNotifications: () => {
        if (confirm('Clear all notifications?')) {
            app.notifications.list = [];
            localStorage.setItem('bh_notifications', JSON.stringify([]));
            app.fetchNotifications();
            app.updateNotificationBadge();
        }
    },

    updateNotificationBadge: () => {
        const unreadCount = app.notifications.list.filter(n => !n.read).length;
        const badge = document.getElementById('notification-badge');
        const mobileBadge = document.getElementById('mobile-notification-badge');
        
        if (unreadCount > 0) {
            badge?.classList.remove('hidden');
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            mobileBadge?.classList.remove('hidden');
            mobileBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            badge?.classList.add('hidden');
            mobileBadge?.classList.add('hidden');
        }
    },

    getTimeAgo: (date) => {
        const now = new Date();
        const secondsAgo = Math.floor((now - date) / 1000);
        
        if (secondsAgo < 60) return 'Just now';
        const minutesAgo = Math.floor(secondsAgo / 60);
        if (minutesAgo < 60) return `${minutesAgo}m ago`;
        const hoursAgo = Math.floor(minutesAgo / 60);
        if (hoursAgo < 24) return `${hoursAgo}h ago`;
        const daysAgo = Math.floor(hoursAgo / 24);
        if (daysAgo < 7) return `${daysAgo}d ago`;
        return date.toLocaleDateString();
    },

    sendBrowserNotification: (title, message) => {
        // Only send if user has granted permission and browser supports it
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '🏠',
                tag: 'boarding-house-notification',
                requireInteraction: false
            });
        }
    },

    requestNotificationPermission: () => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    // --- Home Logic ---
    fetchHomeData: async () => {
        // Check session validity
        if (!Security.session.checkExpiration()) return;
        
        const container = document.getElementById('home-announcements-list');
        const soaContainer = document.getElementById('home-soa-summary');

        // 1. Get Top 2 Announcements
        try {
            const snap = await db.collection('announcements')
                .orderBy('createdAt', 'desc')
                .limit(2)
                .get();
            
            let html = '';
            snap.forEach(doc => {
                const data = doc.data();
                const date = formatDate(data.createdAt);
                const safeTitle = Security.sanitizeText(data.title);
                const safeBody = Security.sanitizeText(data.body);
                html += `
                    <div class="announcement-card">
                        <div class="announcement-meta">
                            <small>${date}</small>
                        </div>
                        <h4>${safeTitle}</h4>
                        <p>${safeBody}</p>
                    </div>
                `;
            });
            container.innerHTML = html || '<p class="loading-text">No new announcements.</p>';
        } catch (e) { 
            console.error("News Error:", e);
            container.innerHTML = '<p>Error loading news.</p>'; 
        }

        // 2. Get Latest SOA
        try {
            const snap = await db.collection('soas')
                .where('roomNo', '==', app.user.roomNo)
                .orderBy('month', 'desc')
                .limit(1)
                .get();

            if (!snap.empty) {
                const data = snap.docs[0].data();
                // SAFEGUARDS: Check if fields exist before using them
                const safeStatus = (data.status || 'unpaid'); 
                const safeAmount = (data.totalAmount || 0);

                soaContainer.innerHTML = `
                    <div style="text-align:center; padding: 0.75rem 0;">
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0 0 0.5rem 0; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Due: ${data.dueDate || 'N/A'}</p>
                        <h1 style="font-size: 2rem; color: var(--primary); margin: 0 0 0.5rem 0; font-weight: 700;">₱${safeAmount.toFixed(2)}</h1>
                        <span class="status-badge status-${safeStatus.toLowerCase()}">${safeStatus}</span>
                    </div>
                `;
            } else {
                soaContainer.innerHTML = `
                    <div class="no-bill-state">
                        <div class="status-icon">✓</div>
                        <div class="status-title">All Caught Up</div>
                        <div class="status-description">No active bills at the moment</div>
                    </div>
                `;
            }
        } catch (e) { 
            console.error("SOA Error:", e);
            soaContainer.innerHTML = '<p>Error loading bill.</p>'; 
        }
    },

    // --- Announcements Logic ---

    // --- Announcements Logic ---
    fetchAnnouncements: async () => {
        const container = document.getElementById('all-announcements-list');
        container.innerHTML = 'Loading...';
        
        try {
            const snap = await db.collection('announcements').orderBy('createdAt', 'desc').get();
            let html = '';
            snap.forEach(doc => {
                const data = doc.data();
                const date = formatDate(data.createdAt);
                const safeTitle = Security.sanitizeText(data.title);
                const safeBody = Security.sanitizeText(data.body);
                html += `
                    <div class="announcement-card">
                        <div class="announcement-meta">
                            <small>${date}</small>
                        </div>
                        <h4>${safeTitle}</h4>
                        <p>${safeBody}</p>
                    </div>
                `;
            });
            container.innerHTML = html || '<p class="loading-text">No announcements found.</p>';
        } catch(e) {
            console.error(e);
            container.innerHTML = "<p>Error loading data.</p>";
        }
    },

    // --- Tickets Logic ---
    fetchTickets: async () => {
        const container = document.getElementById('tickets-list');
        container.innerHTML = 'Loading...';

        try {
            const snap = await db.collection('tickets')
                .where('roomNo', '==', app.user.roomNo)
                .orderBy('createdAt', 'desc')
                .get();

            let html = '';
            snap.forEach(doc => {
                const data = doc.data();
                const date = formatDate(data.createdAt);
                const safeCategory = Security.sanitizeText(data.category);
                const safeMessage = Security.sanitizeText(data.message);
                const safeStatus = Security.sanitizeText(data.status);
                html += `
                    <div class="ticket-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                            <h4 style="margin:0;">${safeCategory.toUpperCase()}</h4>
                            <span class="status-badge status-${safeStatus}">${safeStatus}</span>
                        </div>
                        <p>${safeMessage}</p>
                        <div class="ticket-meta">
                            <small>Submitted: ${date}</small>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html || '<p class="loading-text">You haven\'t submitted any tickets.</p>';
        } catch(e) {
            console.error(e);
            container.innerHTML = "<p>Error loading tickets.</p>";
        }
    },

    submitTicket: async (e) => {
        e.preventDefault();
        const cat = document.getElementById('ticket-category').value;
        const msgInput = document.getElementById('ticket-message').value;
        const btn = e.target.querySelector('button');
        
        btn.disabled = true;
        btn.innerText = "Submitting...";

        try {
            // Validate and sanitize message
            const msg = Security.validateMessage(msgInput);
            
            await db.collection('tickets').add({
                roomNo: app.user.roomNo,
                category: cat,
                message: msg,
                status: 'new',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Ticket submitted successfully!');
            document.getElementById('ticket-form').reset();
            app.fetchTickets(); // Refresh list
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error submitting ticket');
        } finally {
            btn.disabled = false;
            btn.innerText = "Submit Ticket";
        }
    },

    // --- Billing Logic ---
    // --- Billing Logic ---
    fetchBilling: async () => {
        const container = document.getElementById('billing-list');
        container.innerHTML = 'Loading...';

        const scheduleContainer = document.getElementById('payment-schedule');
        const receiptsContainer = document.getElementById('receipts-list');
        if (scheduleContainer) scheduleContainer.innerHTML = 'Loading schedule...';
        if (receiptsContainer) receiptsContainer.innerHTML = 'Loading receipts...';

        try {
            const snap = await db.collection('soas')
                .where('roomNo', '==', app.user.roomNo)
                .orderBy('month', 'desc')
                .get();

            let html = '';
            const bills = [];
            snap.forEach(doc => {
                const data = doc.data();
                // SAFEGUARDS: Default values if data is missing
                const safeStatus = (data.status || 'unpaid');
                const safeTotal = (data.totalAmount || 0);

                // Use the correct key name for electric amount
                const electric = data.electricAmount || data.electricalAmount || 0;

                html += `
                    <div class="soa-card">
                        <div class="soa-header">
                            <h4 class="soa-month">Month: ${data.month || 'N/A'}</h4>
                            <span class="status-badge status-${safeStatus.toLowerCase()}">${safeStatus}</span>
                        </div>
                        <div class="soa-details">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.75rem;">
                                <div>
                                    <small style="color: var(--text-muted); font-size: 0.75rem;">Water</small>
                                    <div style="font-weight: 600;">₱${(data.waterAmount || 0).toFixed(2)}</div>
                                </div>
                                <div>
                                    <small style="color: var(--text-muted); font-size: 0.75rem;">Electricity</small>
                                    <div style="font-weight: 600;">₱${electric.toFixed(2)}</div>
                                </div>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--danger); font-weight: 600;">Due: ${data.dueDate || 'N/A'}</div>
                        </div>
                        <div class="soa-total">
                            Total: ₱${safeTotal.toFixed(2)}
                        </div>
                    </div>
                `;

                bills.push({
                    id: doc.id,
                    ...data,
                    status: safeStatus,
                    totalAmount: safeTotal,
                    electricAmount: electric
                });
            });
            container.innerHTML = html || '<p class="loading-text">No billing history found.</p>';

            app._lastBills = bills;
            app.renderPaymentSchedule(bills);
            app.renderReceipts(bills);
        } catch(e) {
            console.error("Billing List Error:", e);
            container.innerHTML = "<p>Error loading bills.</p>";
            if (scheduleContainer) scheduleContainer.innerHTML = '<p>Error loading schedule.</p>';
            if (receiptsContainer) receiptsContainer.innerHTML = '<p>Error loading receipts.</p>';
        }
    }

    ,

    renderPaymentSchedule: (bills) => {
        const container = document.getElementById('payment-schedule');
        if (!container) return;

        const upcoming = bills
            .filter(b => (b.status || '').toLowerCase() === 'unpaid' && b.dueDate)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (upcoming.length === 0) {
            container.innerHTML = '<p class="loading-text">No upcoming payments.</p>';
            return;
        }

        let html = '';
        upcoming.forEach(bill => {
            const amount = Number(bill.totalAmount || 0);
            html += `
                <div class="schedule-item">
                    <div>
                        <div class="schedule-date">${bill.dueDate}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${bill.month || 'Billing Period'}</div>
                    </div>
                    <div class="schedule-amount">₱${amount.toFixed(2)}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    renderReceipts: (bills) => {
        const container = document.getElementById('receipts-list');
        if (!container) return;

        const paid = bills.filter(b => (b.status || '').toLowerCase() === 'paid');
        if (paid.length === 0) {
            container.innerHTML = '<p class="loading-text">No receipts yet. Paid bills will appear here.</p>';
            return;
        }

        let html = '';
        paid.forEach(bill => {
            const amount = Number(bill.totalAmount || 0);
            html += `
                <div class="receipt-item">
                    <div class="receipt-info">
                        <div class="receipt-title">Receipt • ${bill.month || 'N/A'}</div>
                        <div class="receipt-meta">Total: ₱${amount.toFixed(2)} • Room ${bill.roomNo || app.user.roomNo}</div>
                    </div>
                    <div class="receipt-actions">
                        <button class="btn-action secondary" onclick="app.viewReceipt('${bill.id}')">👁️ View</button>
                        <button class="btn-action primary" onclick="app.downloadReceipt('${bill.id}')">⬇️ Download</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    viewReceipt: async (billId) => {
        if (!billId) return;

        try {
            // Fetch fresh data from Firestore to ensure we have latest paymentType
            const billDoc = await db.collection('soas').doc(billId).get();
            if (!billDoc.exists) {
                alert('Receipt not found.');
                return;
            }

            const bill = {
                id: billDoc.id,
                ...billDoc.data()
            };

            // Fetch tenant name from Firestore
            let tenantName = app.user.name || 'Tenant';
            try {
                const tenantDoc = await db.collection('tenants')
                    .where('roomNo', '==', bill.roomNo)
                    .limit(1)
                    .get();
                
                if (!tenantDoc.empty) {
                    tenantName = tenantDoc.docs[0].data().name || tenantName;
                }
            } catch(e) {
                console.log('Could not fetch tenant name:', e);
            }

            // Get tenant information for receipt
            const tenant = {
                name: tenantName,
                roomNo: bill.roomNo
            };

            // Open professional e-receipt in new window for viewing
            receipt.openReceipt(bill, tenant);
        } catch(e) {
            console.error('Error fetching receipt:', e);
            alert('Error loading receipt.');
        }
    },

    downloadReceipt: async (billId) => {
        if (!billId) return;

        try {
            // Fetch fresh data from Firestore to ensure we have latest paymentType
            const billDoc = await db.collection('soas').doc(billId).get();
            if (!billDoc.exists) {
                alert('Receipt not found.');
                return;
            }

            const bill = {
                id: billDoc.id,
                ...billDoc.data()
            };

            // Fetch tenant name from Firestore
            let tenantName = app.user.name || 'Tenant';
            try {
                const tenantDoc = await db.collection('tenants')
                    .where('roomNo', '==', bill.roomNo)
                    .limit(1)
                    .get();
                
                if (!tenantDoc.empty) {
                    tenantName = tenantDoc.docs[0].data().name || tenantName;
                }
            } catch(e) {
                console.log('Could not fetch tenant name:', e);
            }

            // Get tenant information for receipt
            const tenant = {
                name: tenantName,
                roomNo: bill.roomNo
            };

            // Download professional e-receipt as HTML file
            receipt.downloadAsHTML(bill, tenant);
        } catch(e) {
            console.error('Error downloading receipt:', e);
            alert('Error downloading receipt.');
        }
    },

    _findBillById: (billId) => {
        // Re-fetch from local cache by reading latest from billing list in memory
        // Store last fetched bills on app for receipt downloads
        return app._lastBills ? app._lastBills.find(b => b.id === billId) : null;
    }
};

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', app.init);
document.getElementById('login-form').addEventListener('submit', app.login);
document.getElementById('ticket-form').addEventListener('submit', app.submitTicket);