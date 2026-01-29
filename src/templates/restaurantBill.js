/**
 * Generate Restaurant Bill HTML
 * Migrated from frontend: src/components/utils/printBillTemplates.js
 */
const imageHelper = require('../utils/imageHelper');

const generateRestaurantBill = (
  orderId,
  kot_code,
  KDSInvoiceId,
  orderDetails,
  orderType,
  transactionDetails,
  whatsappNumber
) => {
  // Get logo as base64 (or empty string if not found)
  const logoHTML = imageHelper.getLogoHTML('80px', 'KTR Logo');
  return `
  <html>
    <head>
      <title>Bill - ${kot_code}</title>
      <style>
             @page {
          size: 58mm auto;  /* width 58mm for thermal roll paper, height auto */
          margin: 0;  /* Remove all margins to eliminate white space */
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          padding: 2px;  /* Minimal padding */
        }
        .page {
          width: 58mm;
          margin: 0 auto;
          padding: 2px 4px 4px;  /* Minimal top/side padding */
        }
        .center { text-align: center; }

        /* Header text */
        .restaurant-name-top {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        .tagline {
          font-size: 11px;
          margin-bottom: 6px;
        }

        /* Logo block */
        .logo-wrapper {
          margin: 4px 0 3px;
          display: flex;
          justify-content: center;
        }
        .logo {
          width: 60px;
          height: 30px;
          object-fit: contain;
        }

        .branch-name {
          font-size: 12px;
          font-weight: bold;
          margin-top: 4px;
        }
        .address-line {
          font-size: 10px;
          line-height: 1.3;
        }
        .section-title {
          font-size: 11px;
          font-weight: bold;
          margin-top: 6px;
        }

        .divider-full {
          border-bottom: 1px solid #000;
          margin: 6px 0;
        }

        .bill-info {
          font-size: 11px;
          margin: 2px 0;
        }

        /* KOT / KDS block */
        .kot-block {
          font-size: 11px;
          text-align: center;
          margin: 5px 0;
          font-weight: bold;
        }

        /* Items table */
        .items-header,
        .item-row {
          display: flex;
          font-size: 11px;
        }
        .items-header {
          font-weight: bold;
          margin-top: 5px;
          padding-bottom: 2px;
          border-bottom: 1px solid #000;
        }
        .col-desc { flex: 2.2; }
        .col-qty { flex: 0.6; text-align: center; }
        .col-rate { flex: 1; text-align: right; }
        .col-amt { flex: 1; text-align: right; }
        .item-row {
          margin: 3px 0;
        }

        /* Totals */
        .totals {
          margin-top: 6px;
          border-top: 1px solid #000;
          padding-top: 3px;
          font-size: 11px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        .grand-total {
          font-weight: bold;
          margin-top: 3px;
          padding-top: 3px;
          border-top: 1px solid #000;
          font-size: 12px;
        }

        /* Bottom GST block */
        .gst-block {
          margin-top: 8px;
          font-size: 10px;
        }
        .gst-line {
          text-align: center;
          margin: 2px 0;
        }
        .footer {
          margin-top: 6px;
          text-align: center;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="center">
          <div class="restaurant-name-top">Karnataka Tiffin Room</div>
          <div class="tagline">Bringing the flavors of Bengaluru</div>
        </div>

        <!-- Logo (automatically loaded from public/assets/logo.png) -->
        <div class="logo-wrapper">
          ${logoHTML}
        </div>

        <div class="center">
          <div class="branch-name">KTR-Versova</div>
          <div class="address-line">
            Shop no. 202, Society, JP Rd, Aram Nagar Part 2, Machlimar,
          </div>
          <div class="address-line">
            Versova, Andheri West, Mumbai, Maharashtra 400061
          </div>
          <!-- <div class="section-title">TAX INVOICE</div> -->
        </div>

        <div class="divider-full"></div>

        <div class="kot-block">
          <div>KOT: ${kot_code}</div>
        </div>

        <div class="divider-full"></div>

        <div class="bill-info">BILL NO: ${orderId}</div>
        <div>KDS Invoice ID: ${KDSInvoiceId}</div>

       <!-- <br/> -->
        <div class="bill-info">DATE: ${new Date().toLocaleDateString('en-GB')}</div>
        <div class="bill-info">TIME: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
        <div class="bill-info">TYPE: ${orderType}</div>
        <div class="bill-info">KIOSK: ${orderDetails.kiosk || 'KTR1'}</div>

        <div class="divider-full"></div>

        <div class="items-header">
          <div class="col-desc">DESCRIPTION</div>
          <div class="col-qty">QTY</div>
          <div class="col-rate">RATE</div>
          <div class="col-amt">AMOUNT</div>
        </div>

        ${orderDetails.items.map(item => {
    const itemPrice = item.price;
    const itemTotal = itemPrice * item.quantity;
    return `
          <div class="item-row">
            <div class="col-desc">${item.itemName}</div>
            <div class="col-qty">${item.quantity}</div>
            <div class="col-rate">${itemPrice.toFixed(2)}</div>
            <div class="col-amt">${itemTotal.toFixed(2)}</div>
          </div>
          `;
  }).join('')}

        <div class="totals">
          <div class="total-row">
            <span>Total:</span>
            <span>Rs ${orderDetails.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>CGST 2.5%</span>
            <span>+${(orderDetails.tax / 2).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>SGST 2.5%</span>
            <span>+${(orderDetails.tax / 2).toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>PAYABLE AMOUNT:</span>
            <span>Rs ${orderDetails.total.toFixed(0)}</span>
          </div>
        </div>

        <div class="gst-block">
          <div class="gst-line">GST No: 27AA0FH7156G1Z0</div>
          <div class="gst-line">CIN No: 6731</div>
          <div class="gst-line">FSSAI No: 21524005001190</div>
        </div>

        <div class="footer">
          Thank You & Visit us Again
        </div>
      </div>
    </body>
  </html>
  `;
};

module.exports = generateRestaurantBill;
