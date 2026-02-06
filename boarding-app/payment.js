// GCash Payment Integration Helper
// This enables actual payment verification via GCash reference codes

const GCashPayment = {
    // GCash Business Account Details
    ACCOUNT_NAME: "Janet Regidor", // Update with actual account name
    ACCOUNT_NUMBER: "0966-570-0206", // Update with actual GCash number
    
    // Generate reference code for tenant
    generateRefCode: (roomNo, billMonth) => {
        // Format: BH-[ROOM]-[MONTH]-[RANDOM]
        // Example: BH-101-202602-A1B2
        const month = billMonth.replace('-', '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `BH-${roomNo}-${month}-${random}`;
    },

    // Verify payment by reference code (requires API integration)
    verifyPayment: async (refCode) => {
        // TODO: Integrate with GCash API or manual verification system
        // This would check actual GCash transaction logs
        console.log("Payment verification not yet implemented:", refCode);
        return false;
    },

    // Format payment instruction for tenant
    formatInstruction: (roomNo, amount, billMonth) => {
        const refCode = GCashPayment.generateRefCode(roomNo, billMonth);
        return `
GCash Payment Instructions:
================================
Send to: ${GCashPayment.ACCOUNT_NAME}
Number: ${GCashPayment.ACCOUNT_NUMBER}
Amount: ₱${amount.toFixed(2)}
Reference: ${refCode}

Important: Include reference code as message/notes
This helps us match your payment to your bill
        `;
    }
};
