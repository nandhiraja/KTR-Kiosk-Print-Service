/**
 * Generate KOT Bill HTML
 * Migrated from frontend: src/components/utils/printBillTemplates.js
 */
const imageHelper = require('../utils/imageHelper');

const generateKOTBill = (orderId, kot_code, KDSInvoiceId, orderDetails) => {
  // Get logo as base64 (optional, uncomment if you want logo in KOT Bill)
  // const logoHTML = imageHelper.getLogoHTML('60px', 'KTR Logo');
  return `
  <html>
    <head>
      <title>KOT - ${kot_code}</title>
      <style>
            @page {
          size: 58mm auto;  /* width 58mm for thermal roll paper, height auto */
          margin: 0;  /* Remove all margins */
          }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          margin: 0;
          padding: 2px;
        }
        .page {
          width: 58mm;
          margin: 0 auto;
          padding: 2px 4px 4px;
        }
        .center {
          text-align: center;
        }
        .restaurant-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .kot-box-wrapper {
          margin-top: 4px;
          display: flex;
          justify-content: center;
        }
        .kot-box {
          border: 2px solid #000;
          border-radius: 8px;
          padding: 4px 12px;
          display: inline-block;
          font-weight: bold;
          font-size: 10px;
          text-transform: uppercase;
        }
        .token-no{
            font-family: Arial, sans-serif;
            font-size: 20px;
            font-weight: bold;
        }
        .info-line {
          font-size: 12px;
          margin: 2px 0;
        }
        .label {
          display: inline-block;
          min-width: 70px;
          font-weight: bold;
        }
        .divider {
          margin: 6px 0;
          border-bottom: 1px dashed #666;
        }
        .items-header,
        .item-row {
          font-size: 13px;
        }
        .items-header {
          margin: 4px 0 3px;
          border-bottom: 1px dashed #333;
          padding-bottom: 2px;
          font-weight: bold;
        }
        .items-header span:first-child,
        .item-row span:first-child {
          display: inline-block;
          width: 30px;
          font-weight: bold;
        }
        .item-row {
          margin: 3px 0;
        }
        .instruction-title {
          margin-top: 8px;
          font-size: 12px;
          font-weight: bold;
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
           <center> KOT No
            <div class="token-no">${kot_code}</div>
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
          <span>ITEMS</span>
        </div>

        ${orderDetails.items.map(item => `
          <div class="item-row">
            <span>${item.quantity}</span>
            <span>${item.itemName}</span>
          </div>
        `).join('')}

        <div class="divider"></div>

        <div class="instruction-title">
          Instruction:
        </div>
      </div>
    </body>
  </html>
  `;
};

module.exports = generateKOTBill;
