/**
 * Generate Coffee KOT (coffee items only)
 * Migrated from frontend: src/components/utils/printBillTemplates.js
 */
const imageHelper = require('../utils/imageHelper');

// Coffee Category ID (from backend) - Only coffee, not beverages
const COFFEE_CATEGORY_ID = "6868ca5dc29c8ed4d3c98dd8";

const generateCoffeeKOT = (orderId, kot_code, KDSInvoiceId, orderDetails) => {
  // Get logo as base64 for KOT
  const kotLogoHTML = imageHelper.getLogoHTML('28px', 'KTR Logo');
  // Filter only coffee items using categoryId (not beverages)
  const coffeeItems = orderDetails.items.filter(item =>
    item.categoryId === COFFEE_CATEGORY_ID
  );

  if (coffeeItems.length === 0) {
    return null; // No coffee items to print
  }

  return `
  <html>
    <head>
      <title>Coffee KOT - ${kot_code}</title>
      <style>
            @page {
          size: 80mm auto;
          margin: 0;
          }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
          padding: 2px;
        }
        .page {
          width: 90mm;
          margin: 0 auto;
          padding: 4px 6px 6px;
        }
        .center {
          text-align: center;
        }
        .restaurant-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 6px;
        }
        .kot-box-wrapper {
          margin-top: 6px;
          display: flex;
          justify-content: center;
        }
        .kot-box {
          border: 2px solid #000;
          border-radius: 10px;
          padding: 6px 18px;
          display: inline-block;
          font-weight: bold;
          font-size: 8px;
          text-transform:uppercase;
          background-color: #fff8dc;
        }
        .token-no{
            font-family: poppins;
            font-size: 22px;
            font-weight: bold;
            display: flex;
            flex-direction: column; /* Vertical stack */
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .logo-wrapper {
          margin: 4px 0;
          display: flex;
          justify-content: center;
        }
        .kot-logo {
          height: 28px; /* Logo size */
          width: auto; /* Maintain aspect ratio */
          object-fit: contain;
        }
        .info-line {
          font-size: 11px;
          margin: 2px 0;
        }
        .label {
          display: inline-block;
          min-width: 85px;
        }
        .divider {
          margin: 8px 0;
          border-bottom: 1px dashed #666;
        }
        .items-header,
        .item-row {
          font-size: 11px;
}
        .items-header {
          margin: 6px 0 4px;
          border-bottom: 1px dashed #333;
          padding-bottom: 3px;
          font-weight:bold;
        }
        .items-header span:first-child,
        .item-row span:first-child {
          display: inline-block;
          width: 30px;
        }
        .instruction-title {
          margin-top: 10px;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="center">
          <div class="restaurant-name">Karnataka Tiffin Room (Versova)</div>
        </div>

        <div class="kot-box-wrapper">
          <div class="kot-box">
           <center> 
            <div class="token-no">
              ${kotLogoHTML}
              <span class="token-number">${kot_code.slice(4)}</span>
            </div>
            </center>
          </div>
        </div>

        <div style="margin-top: 10px;">
          <div class="info-line">
            <span class="label">BILL TYPE:</span> ${orderDetails.billType || 'Dine In'}
          </div>
          <div class="info-line">
            <span class="label">BILL NO:</span> KTR-${orderId.slice(4, 10)}
          </div>
          <div class="info-line">
            <span class="label">DATE:</span> ${new Date().toLocaleDateString('en-GB')}
            &nbsp;&nbsp;TIME: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
          <div class="info-line">
            <span class="label">KIOSK:</span> ${orderDetails.kiosk || 'KTR1'}
          </div>
        </div>

        <div class="divider"></div>

        <div class="items-header">
          <span>QTY</span>
          <span>COFFEE ITEMS</span>
        </div>

        ${coffeeItems.map(item => `
          <div class="item-row">
            <span>${item.quantity}</span>
            <span>${item.itemName}</span>
          </div>
        `).join('')}

        <div class="divider"></div>

        <div class="instruction-title">
          Instruction: COFFEE COUNTER
        </div>
      </div>
    </body>
  </html>
  `;
};

module.exports = generateCoffeeKOT;
