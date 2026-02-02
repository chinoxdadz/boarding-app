// --- CONFIGURATION (Same as app.js) ---
const firebaseConfig = {
  apiKey: "AIzaSyAtzL7jEhQhtfxbEMxFmttcDA7GLCh1d7g",
  authDomain: "boarding-portal.firebaseapp.com",
  projectId: "boarding-portal",
  storageBucket: "boarding-portal.firebasestorage.app",
  messagingSenderId: "303774773682",
  appId: "1:303774773682:web:1ee0a3c98793c8ab7cb4ab"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Unit prices for consumption-based billing
const UNIT_PRICES = {
    water: 50,      // Cost per m³ (cubic meter)
    electric: 12    // Cost per kWh (kilowatt-hour)
};

const adminApp = {
    // Simple password check (Not secure for real banking apps, but fine for this)
    login: () => {
        const pass = document.getElementById('admin-pass').value;
        if(pass === "admin123") { // <--- CHANGE THIS PASSWORD!
            document.getElementById('admin-login').classList.add('hidden');
            document.getElementById('admin-dash').classList.remove('hidden');
            adminApp.loadTenants();
            adminApp.loadTickets();
        } else {
            alert("Wrong password");
        }
    },

    // 1. Post News
    postNews: async () => {
        const title = document.getElementById('news-title').value;
        const body = document.getElementById('news-body').value;
        if(!title || !body) return alert("Fill in all fields");

        try {
            await db.collection('announcements').add({
                title: title,
                body: body,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("Announcement Posted!");
            document.getElementById('news-title').value = "";
            document.getElementById('news-body').value = "";
        } catch(e) { alert("Error: " + e.message); }
    },

    // 2. Fetch meter readings for selected room and month
    fetchReadings: async () => {
        const room = document.getElementById('bill-room').value;
        const month = document.getElementById('bill-month').value; // Format: "2026-02"

        if (!room || !month) {
            document.getElementById('bill-water-reading').value = '';
            document.getElementById('bill-electric-reading').value = '';
            return;
        }

        try {
            // Query all meter readings for this room
            const readingsSnap = await db.collection('meter_readings')
                .where('roomNo', '==', room)
                .get();

            if (readingsSnap.empty) {
                alert(`No meter reading found for Room ${room}. Please add it first.`);
                document.getElementById('bill-water-reading').value = '';
                document.getElementById('bill-electric-reading').value = '';
                return;
            }

            // Filter readings for the selected month (client-side)
            const readings = readingsSnap.docs
                .map(doc => ({ ...doc.data(), docId: doc.id }))
                .filter(r => r.readingDate && r.readingDate.startsWith(month))
                .sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));

            if (readings.length > 0) {
                document.getElementById('bill-water-reading').value = readings[0].waterReading || '';
                document.getElementById('bill-electric-reading').value = readings[0].electricReading || '';
            } else {
                alert(`No meter reading found for Room ${room} in ${month}. Please add it first.`);
                document.getElementById('bill-water-reading').value = '';
                document.getElementById('bill-electric-reading').value = '';
            }
        } catch(e) {
            console.error(e);
            alert("Error fetching readings: " + e.message);
        }
    },

    // 3. Create Bill with auto-calculated costs from meter readings
    createBill: async () => {
        const room = document.getElementById('bill-room').value;
        const month = document.getElementById('bill-month').value;
        const rental = parseFloat(document.getElementById('bill-rental').value) || 0;
        const currentWaterReading = parseFloat(document.getElementById('bill-water-reading').value);
        const currentElectricReading = parseFloat(document.getElementById('bill-electric-reading').value);
        const due = document.getElementById('bill-due').value;

        if(!room || !month) return alert("Room and Month are required");
        if(isNaN(currentWaterReading) || isNaN(currentElectricReading)) return alert("Please fetch meter readings first (select Room and Month)");

        try {
            // Get all readings for this room
            const allReadingsSnap = await db.collection('meter_readings')
                .where('roomNo', '==', room)
                .get();

            let waterConsumption = 0;
            let electricConsumption = 0;

            if (!allReadingsSnap.empty) {
                // Calculate previous month
                const [year, monthNum] = month.split('-');
                const prevMonth = parseInt(monthNum) - 1;
                let prevYear = parseInt(year);
                let prevMonthStr = prevMonth.toString().padStart(2, '0');
                
                if (prevMonth === 0) {
                    prevYear--;
                    prevMonthStr = '12';
                }
                
                const prevMonthStr_full = `${prevYear}-${prevMonthStr}`;

                // Filter and sort readings to find previous month's reading
                const allReadings = allReadingsSnap.docs
                    .map(doc => doc.data())
                    .filter(r => r.readingDate)
                    .sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));

                // Find the most recent reading from previous month
                const prevReading = allReadings.find(r => r.readingDate.startsWith(prevMonthStr_full));

                if (prevReading) {
                    waterConsumption = currentWaterReading - (prevReading.waterReading || 0);
                    electricConsumption = currentElectricReading - (prevReading.electricReading || 0);
                } else {
                    // If no previous reading, use current reading as consumption (first month)
                    waterConsumption = currentWaterReading;
                    electricConsumption = currentElectricReading;
                }
            } else {
                // If no previous reading, use current reading as consumption (first month)
                waterConsumption = currentWaterReading;
                electricConsumption = currentElectricReading;
            }

            // Ensure consumption is not negative
            waterConsumption = Math.max(0, waterConsumption);
            electricConsumption = Math.max(0, electricConsumption);

            // Calculate costs
            const waterAmount = waterConsumption * UNIT_PRICES.water;
            const electricAmount = electricConsumption * UNIT_PRICES.electric;
            const total = rental + waterAmount + electricAmount;

            // Save bill
            await db.collection('soas').add({
                roomNo: room,
                month: month,
                rentalAmount: rental,
                waterReading: currentWaterReading,
                waterConsumption: waterConsumption,
                waterAmount: waterAmount,
                electricReading: currentElectricReading,
                electricConsumption: electricConsumption,
                electricAmount: electricAmount,
                totalAmount: total,
                dueDate: due,
                status: "unpaid"
            });

            alert(`Bill sent to Room ${room}!\nBreakdown:\nRental: ${rental}\nWater (${waterConsumption}m³): ${waterAmount}\nElectric (${electricConsumption}kWh): ${electricAmount}\nTotal: ${total}`);
            
            // Clear form
            document.getElementById('bill-room').value = '';
            document.getElementById('bill-month').value = '';
            document.getElementById('bill-rental').value = '';
            document.getElementById('bill-water-reading').value = '';
            document.getElementById('bill-electric-reading').value = '';
            document.getElementById('bill-due').value = '';
        } catch(e) { 
            console.error(e);
            alert("Error: " + e.message); 
        }
    },

    // 2.5 Load Tenants
    loadTenants: async () => {
        const tbody = document.getElementById('tenants-tbody');
        const roomSelect = document.getElementById('bill-room');
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--text-muted);">Loading...</td></tr>';
        
        try {
            const snap = await db.collection('tenants').orderBy('roomNo', 'asc').get();
            
            if (snap.empty) {
                tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--text-muted);">No tenants found.</td></tr>';
                return;
            }

            let tableHtml = '';
            let options = '<option value="">Select Room</option>';
            snap.forEach(doc => {
                const data = doc.data();
                const name = data.name || 'N/A';
                const roomNo = data.roomNo || 'N/A';
                tableHtml += `<tr><td>${name}</td><td>${roomNo}</td></tr>`;
                options += `<option value="${roomNo}">${roomNo}</option>`;
            });
            tbody.innerHTML = tableHtml;
            roomSelect.innerHTML = options;
        } catch (e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error loading tenants.</td></tr>';
        }
    },

    // 3. Load Tickets (Updated with Buttons)
    loadTickets: async () => {
        const container = document.getElementById('admin-tickets-list');
        container.innerHTML = 'Loading...';
        
        try {
            // Get tickets, ordered by newest first
            const snap = await db.collection('tickets').orderBy('createdAt', 'desc').get();
            let html = '';
            
            snap.forEach(doc => {
                const data = doc.data();
                const id = doc.id; // We need the ID to update/delete it
                const isResolved = data.status === 'resolved';
                const statusColor = isResolved ? 'green' : 'red';
                const statusText = isResolved ? '✅ Solved' : '🔥 Open';

                // Only show buttons if the ticket is NOT resolved yet
                const actionButtons = isResolved 
                    ? `<button onclick="adminApp.deleteTicket('${id}')" style="background:#666; color:white; padding:5px;">🗑 Delete</button>`
                    : `<button onclick="adminApp.resolveTicket('${id}')" style="background:green; color:white; padding:5px; margin-right:5px;">✅ Mark Done</button>
                       <button onclick="adminApp.deleteTicket('${id}')" style="background:red; color:white; padding:5px;">🗑 Delete</button>`;

                // Robust date handling: support Firestore Timestamps and JS Date
                const created = data.createdAt;
                let dateStr = 'N/A';
                if (created) {
                    if (created.seconds) dateStr = new Date(created.seconds * 1000).toLocaleDateString();
                    else dateStr = new Date(created).toLocaleDateString();
                }

                html += `
                    <div class="card" style="border-left: 5px solid ${statusColor}; margin-bottom:10px; padding:15px;">
                        <div style="display:flex; justify-content:space-between;">
                            <strong>Room ${data.roomNo}</strong>
                            <small style="color:${statusColor}; font-weight:bold;">${statusText}</small>
                        </div>
                        <div style="margin-top:6px;">
                            ${data.acknowledged ? '<small style="color:var(--success); font-weight:600">Acknowledged</small>' : ''}
                        </div>
                        <p style="margin: 10px 0;">${data.message || data.description || ''}</p>
                        <div style="display:flex; justify-content:space-between; align-items:end;">
                            <small style="color:grey">${dateStr}</small>
                            <div>${actionButtons}</div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html || '<p>No tickets found.</p>';
        } catch(e) { 
            console.error(e);
            container.innerHTML = '<p>Error loading tickets.</p>'; 
        }
    },

        

    // 4. Function to Mark as Resolved
    resolveTicket: async (id) => {
        if(!confirm("Mark this issue as fixed?")) return;
        try {
            await db.collection('tickets').doc(id).update({ status: 'resolved' });
            adminApp.loadTickets(); // Refresh the list
        } catch(e) { alert("Error: " + e.message); }
    },

    // 5. Function to Delete Ticket
    deleteTicket: async (id) => {
        if(!confirm("Permanently delete this ticket?")) return;
        try {
            await db.collection('tickets').doc(id).delete();
            adminApp.loadTickets(); // Refresh the list
        } catch(e) { alert("Error: " + e.message); }
    },

    // 6. Add a new row to readings table
    addReadingRow: () => {
        const tbody = document.getElementById('readings-tbody');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" placeholder="101" class="reading-input"></td>
            <td><input type="number" placeholder="0.00" class="reading-input"></td>
            <td><input type="number" placeholder="0.00" class="reading-input"></td>
            <td><input type="date" class="reading-input"></td>
            <td><button onclick="adminApp.saveReading(this)" class="btn-small">Save</button></td>
        `;
        tbody.appendChild(row);
    },

    // 7. Save a meter reading row
    saveReading: async (btn) => {
        const row = btn.closest('tr');
        const inputs = row.querySelectorAll('.reading-input');
        
        const roomNo = inputs[0].value.trim();
        const waterReading = parseFloat(inputs[1].value) || 0;
        const electricReading = parseFloat(inputs[2].value) || 0;
        const readingDate = inputs[3].value; // Format: "2026-02-15"

        if (!roomNo) return alert('Please enter room number');
        if (!readingDate) return alert('Please select a date');
        if (waterReading === 0 && electricReading === 0) return alert('Please enter at least one meter reading value');

        try {
            // Validate room exists
            const tenantSnap = await db.collection('tenants')
                .where('roomNo', '==', roomNo)
                .limit(1)
                .get();
            
            if (tenantSnap.empty) {
                return alert(`Room ${roomNo} does not exist in the system.`);
            }

            await db.collection('meter_readings').add({
                roomNo: roomNo,
                waterReading: waterReading,
                electricReading: electricReading,
                readingDate: readingDate, // Stored as string in YYYY-MM-DD format
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(`Reading saved for Room ${roomNo} on ${readingDate}!`);
            // Clear the row inputs
            inputs.forEach(input => input.value = '');
        } catch (e) {
            console.error(e);
            alert('Error saving reading: ' + e.message);
        }
    }
};