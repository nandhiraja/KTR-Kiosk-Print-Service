/**
 * Generate Food KOT (non-coffee items)
 * Migrated from frontend: src/components/utils/printBillTemplates.js
 */
const imageHelper = require('../utils/imageHelper');

// Coffee Category ID (from backend) - Only coffee, not beverages
const COFFEE_CATEGORY_ID = "6868ca5dc29c8ed4d3c98dd8";

const generateFoodKOT = (orderId, kot_code, KDSInvoiceId, orderDetails) => {
  // Get logo as base64 for KOT
  const kotLogoHTML = imageHelper.getLogoHTML('28px', 'KTR Logo');
  // Filter out only coffee items (beverages stay with food)
  const foodItems = orderDetails.items.filter(item =>
    item.categoryId !== COFFEE_CATEGORY_ID
  );

  if (foodItems.length === 0) {
    return null; // No food items to print
  }

  return `
  <html>
    <head>
      <title>Food KOT - ${kot_code}</title>
      <style>
        @page { 
          size: 80mm 160mm; 
          margin: 0; 
        }
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          font-family: 'Courier New', Courier, monospace; 
          font-size: 9px; 
          line-height: 1.2; 
          padding: 4px; 
          margin: 10px; 
        }
        .page { 
          width: 76mm; 
          margin: 0 auto; 
        }
        .center { 
          text-align: center; 
        }

        /* Header */
        .restaurant-name { 
          font-size: 11px; 
          font-weight: bold; 
          margin-bottom: 0px; 
        }

        /* KOT Box */
        .kot-box-wrapper { 
          margin-top: 6px; 
          display: flex; 
          justify-content: center; 
        }
        .kot-box { 
          border: 2px solid #000; 
          border-radius: 10px; 
          padding: 12px 16px; 
          display: inline-block; 
          background: #fff; 
        }
        .token-no { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          gap: 2px; 
        }
        .logo-wrapper { 
          margin: 4px 0; 
          display: flex; 
          justify-content: center; 
        }
        .kot-logo { 
          height: 28px; 
          width: auto; 
          object-fit: contain; 
        }
        .token-number { 
          font-size: 32px; 
          font-weight: 900; 
          line-height: 1; 
        }

        /* Info Lines */
        .info-line { 
          font-size: 9px; 
          margin: 1px 0; 
          line-height: 1.4; 
        }
        .label { 
          width: 75px; 
          display: inline-block; 
          font-weight: normal; 
        }

        /* Divider */
        .divider { 
          border-bottom: 1px solid #000; 
          margin: 4px 0; 
        }

        /* Items */
        .items-header { 
          font-weight: bold; 
          border-bottom: 1px dashed #000; 
          padding: 2px 0 3px 0; 
          font-size: 9px; 
          margin-top: 2px; 
        }
        .item-row { 
          font-size: 9px; 
          margin: 2px 0; 
          line-height: 1.4; 
          border-bottom: 1px dashed #000; 
          padding-bottom: 2px; 
        }
        .items-header span:first-child,
        .item-row span:first-child { 
          display: inline-block; 
          width: 32px; 
          font-weight: normal; 
        }

        /* Instruction */
        .instruction-title { 
          font-size: 10px; 
          font-weight: bold; 
          margin-top: 6px; 
          text-align: center; 
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="center">
          <div class="restaurant-name">Karnataka Tiffin Room (Versova)</div>
          <div class="logo-wrapper">
           
          </div>
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
          <span>ITEMS</span>
        </div>

        ${foodItems.map(item => `
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

module.exports = generateFoodKOT;
