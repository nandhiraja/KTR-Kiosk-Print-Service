const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

/**
 * Generate Restaurant Bill using ESC/POS commands
 * This is 5-10x faster than HTML/PDF approach and designed for thermal printers
 */
function generateRestaurantBillESCPOS(orderId, kot_code, KDSInvoiceId, orderDetails, orderType, transactionDetails, whatsappNumber) {

    const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,  // Perfect for your EPSON TM-T driver
        interface: 'printer:Receipt',  // Your printer name from PowerShell
        characterSet: 'SLOVENIA',
        removeSpecialCharacters: false,
        lineCharacter: '-',
        width: 48  // 48 for 80mm paper (EPSON TM-T203dpi is 80mm)
    });

    try {
        // === HEADER ===
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.bold(true);
        printer.println('Karnataka Tiffin Room');
        printer.bold(false);
        printer.setTextNormal();
        printer.println('Bringing the flavors of Bengaluru');
        printer.newLine();

        // === LOGO (Optional - if you have logo image) ===
        // printer.printImage('./path-to-logo.png');
        // printer.newLine();

        // === BRANCH INFO ===
        printer.bold(true);
        printer.println('KTR-Versova');
        printer.bold(false);
        printer.setTextSize(0, 0);  // Small text
        printer.println('Shop no. 202, Society, JP Rd,');
        printer.println('Aram Nagar Part 2, Versova,');
        printer.println('Mumbai, Maharashtra 400061');
        printer.setTextNormal();
        printer.newLine();

        printer.drawLine();

        // === KOT/KDS INFO ===
        printer.alignCenter();
        printer.println(`KOT-ID: ${kot_code}`);
        printer.println(`KDS Invoice: ${KDSInvoiceId}`);
        printer.drawLine();

        // === BILL INFO ===
        printer.alignLeft();
        printer.println(`BILL NO: KTR-${orderId.slice(4, 10)}`);
        printer.println(`Order No: ${orderDetails.orderNumber || ''}`);
        printer.newLine();

        const date = new Date();
        printer.println(`DATE: ${date.toLocaleDateString('en-GB')}`);
        printer.println(`TIME: ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`);
        printer.println(`TYPE: ${orderDetails.billType || orderType || 'DINE IN'}`);
        printer.println(`KIOSK: ${orderDetails.kiosk || 'KTR1'}`);
        printer.println(`PAYMENT: ${transactionDetails?.paymentMethod || 'CASH'}`);

        printer.drawLine();

        // === ITEMS TABLE HEADER ===
        printer.tableCustom([
            { text: 'ITEM', align: 'LEFT', width: 0.45 },
            { text: 'QTY', align: 'CENTER', width: 0.15 },
            { text: 'RATE', align: 'RIGHT', width: 0.18 },
            { text: 'AMT', align: 'RIGHT', width: 0.22 }
        ]);
        printer.drawLine();

        // === ITEMS ===
        orderDetails.items.forEach(item => {
            const itemPrice = item.price;
            const itemTotal = itemPrice * item.quantity;

            printer.tableCustom([
                { text: item.itemName, align: 'LEFT', width: 0.45 },
                { text: item.quantity.toString(), align: 'CENTER', width: 0.15 },
                { text: itemPrice.toFixed(2), align: 'RIGHT', width: 0.18 },
                { text: itemTotal.toFixed(2), align: 'RIGHT', width: 0.22 }
            ]);
        });

        printer.drawLine();

        // === TOTALS ===
        printer.tableCustom([
            { text: 'Total:', align: 'LEFT', width: 0.6 },
            { text: `Rs ${orderDetails.subtotal.toFixed(2)}`, align: 'RIGHT', width: 0.4 }
        ]);

        printer.tableCustom([
            { text: 'CGST 2.5%', align: 'LEFT', width: 0.6 },
            { text: `+${(orderDetails.tax / 2).toFixed(2)}`, align: 'RIGHT', width: 0.4 }
        ]);

        printer.tableCustom([
            { text: 'SGST 2.5%', align: 'LEFT', width: 0.6 },
            { text: `+${(orderDetails.tax / 2).toFixed(2)}`, align: 'RIGHT', width: 0.4 }
        ]);

        printer.drawLine();

        // === GRAND TOTAL ===
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.tableCustom([
            { text: 'PAYABLE:', align: 'LEFT', width: 0.5 },
            { text: `Rs ${orderDetails.total.toFixed(0)}`, align: 'RIGHT', width: 0.5 }
        ]);
        printer.setTextNormal();
        printer.bold(false);

        printer.drawLine();

        // === GST INFO ===
        printer.alignCenter();
        printer.setTextSize(0, 0);
        printer.println('GST No: 27AA0FH7156G1Z0');
        printer.println('CIN No: 6731');
        printer.println('FSSAI No: 21524005001190');
        printer.setTextNormal();
        printer.newLine();

        // === FOOTER ===
        printer.alignCenter();
        printer.println('Thank You & Visit us Again');
        printer.newLine();
        printer.newLine();
        printer.newLine();

        // Cut paper
        printer.cut();

        return printer;

    } catch (error) {
        console.error('ESC/POS Bill Generation Error:', error);
        throw error;
    }
}

module.exports = generateRestaurantBillESCPOS;
