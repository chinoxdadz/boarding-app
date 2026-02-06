// ========================================
// E-RECEIPT GENERATOR
// ========================================
// Generates professional HTML-formatted e-receipts for bills
// Supports HTML display and PDF download via browser print-to-PDF

const receipt = {
    
    /**
     * Generate professional HTML receipt for display
     * @param {Object} bill - Bill object with amount and details
     * @param {Object} tenant - Tenant object with room info
     * @returns {String} HTML receipt markup
     */
    generateHTML: (bill, tenant) => {
        const total = Number(bill.totalAmount || 0).toFixed(2);
        const water = Number(bill.waterAmount || 0).toFixed(2);
        const electric = Number(bill.electricAmount || bill.electricalAmount || 0).toFixed(2);
        const rental = Number(bill.rentalAmount || 0).toFixed(2);
        
        const receiptDate = new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const receiptTime = new Date().toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Receipt</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }
        
        .receipt-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        
        .receipt-title {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        
        .receipt-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .receipt-number {
            font-size: 12px;
            color: #999;
            font-family: monospace;
        }
        
        .receipt-section {
            margin-bottom: 25px;
        }
        
        .section-label {
            font-size: 12px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .info-label {
            color: #666;
            flex: 1;
        }
        
        .info-value {
            color: #333;
            font-weight: 500;
            text-align: right;
            flex: 1;
        }
        
        .charges-container {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .charge-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .charge-label {
            color: #555;
        }
        
        .charge-amount {
            color: #333;
            font-weight: 500;
            font-family: 'Courier New', monospace;
            min-width: 80px;
            text-align: right;
        }
        
        .charge-row.total {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
            font-weight: bold;
            font-size: 16px;
        }
        
        .charge-row.total .charge-label {
            color: #333;
        }
        
        .charge-row.total .charge-amount {
            color: #2ecc71;
            font-size: 18px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 10px;
        }
        
        .status-paid {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-unpaid {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .footer-section {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        
        .qr-section {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #f0f0f0;
            border-radius: 4px;
        }
        
        .qr-section .label {
            font-size: 12px;
            color: #999;
            margin-bottom: 5px;
        }
        
        .receipt-id {
            font-family: monospace;
            font-size: 10px;
            color: #999;
            word-break: break-all;
        }
        
        .print-button {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        
        .btn-print {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        }
        
        .btn-print:hover {
            background: #2980b9;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .receipt-container {
                box-shadow: none;
                border-radius: 0;
                padding: 20px;
                max-width: 100%;
            }
            
            .print-button {
                display: none;
            }
            
            .btn-print {
                display: none;
            }
        }
        
        @media (max-width: 600px) {
            .receipt-container {
                padding: 20px;
            }
            
            .receipt-title {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <!-- Header -->
        <div class="receipt-header">
            <div class="receipt-title">🏠 BHouse</div>
            <div class="receipt-subtitle">Boarding House Management</div>
            <div class="receipt-number">Receipt #${receipt._generateReceiptNumber(bill)}</div>
        </div>
        
        <!-- Tenant Information -->
        <div class="receipt-section">
            <div class="section-label">Tenant Information</div>
            <div class="info-row">
                <span class="info-label">Room Number:</span>
                <span class="info-value">${bill.roomNo || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tenant Name:</span>
                <span class="info-value">${tenant?.name || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Billing Period:</span>
                <span class="info-value">${bill.month || 'N/A'}</span>
            </div>
        </div>
        
        <!-- Charges -->
        <div class="receipt-section">
            <div class="section-label">Charges</div>
            <div class="charges-container">
                <div class="charge-row">
                    <span class="charge-label">Rental Fee</span>
                    <span class="charge-amount">₱${rental}</span>
                </div>
                <div class="charge-row">
                    <span class="charge-label">Water Usage</span>
                    <span class="charge-amount">₱${water}</span>
                </div>
                <div class="charge-row">
                    <span class="charge-label">Electricity Usage</span>
                    <span class="charge-amount">₱${electric}</span>
                </div>
                <div class="charge-row total">
                    <span class="charge-label">Total Amount Due</span>
                    <span class="charge-amount">₱${total}</span>
                </div>
            </div>
        </div>
        
        <!-- Payment Information -->
        <div class="receipt-section">
            <div class="section-label">Payment Details</div>
            <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${bill.paymentType === 'cash' ? '💵 Cash' : '💚 GCash'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Due Date:</span>
                <span class="info-value">${bill.dueDate || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">
                    <span class="status-badge ${receipt._getStatusClass(bill.status)}">${bill.status || 'Pending'}</span>
                </span>
            </div>
        </div>
        
        <!-- Generated Date -->
        <div class="receipt-section">
            <div class="info-row">
                <span class="info-label">Generated On:</span>
                <span class="info-value">${receiptDate} ${receiptTime}</span>
            </div>
        </div>
        
        <!-- QR Code Section -->
        <div class="qr-section">
            <div class="label">Receipt ID</div>
            <div class="receipt-id">${receipt._generateReceiptNumber(bill)}</div>
        </div>
        
        <!-- Footer -->
        <div class="footer-section">
            <p>Thank you for your payment!</p>
            <p style="margin-top: 10px; font-size: 11px; color: #999;">This is an electronically generated receipt. No signature required.</p>
        </div>
        
        <!-- Print Button -->
        <div class="print-button">
            <button class="btn-print" onclick="window.print()">🖨️ Print or Save as PDF</button>
            <button class="btn-print" onclick="window.close()" style="background: #95a5a6; margin-left: 10px;">Close</button>
        </div>
    </div>
</body>
</html>
        `;
    },
    
    /**
     * Display receipt in a new window
     * @param {Object} bill - Bill object
     * @param {Object} tenant - Tenant object
     */
    openReceipt: (bill, tenant) => {
        const html = receipt.generateHTML(bill, tenant);
        const receiptWindow = window.open('', 'e-receipt', 'width=700,height=900');
        receiptWindow.document.write(html);
        receiptWindow.document.close();
    },
    
    /**
     * Download receipt as HTML file
     * @param {Object} bill - Bill object
     * @param {Object} tenant - Tenant object
     */
    downloadAsHTML: (bill, tenant) => {
        const html = receipt.generateHTML(bill, tenant);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${bill.roomNo || 'bill'}-${bill.month || 'statement'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    /**
     * Generate unique receipt number
     */
    _generateReceiptNumber: (bill) => {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const roomNo = (bill.roomNo || '00').toString().padStart(3, '0');
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `RCP-${dateStr}-${roomNo}-${random}`;
    },
    
    /**
     * Get CSS class for status badge
     */
    _getStatusClass: (status) => {
        const statusStr = (status || 'pending').toLowerCase();
        if (statusStr === 'paid') return 'status-paid';
        if (statusStr === 'unpaid') return 'status-unpaid';
        return 'status-pending';
    }
};
