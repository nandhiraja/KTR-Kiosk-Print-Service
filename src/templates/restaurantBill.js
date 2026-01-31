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
          size: 58mm auto; 
          margin: 0; 
        }
        html {
          margin: 0;
          padding: 0;
        }
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          font-family: 'Courier New', Courier, monospace; 
          font-size: 10px; 
          font-weight: 500;
          line-height: 1.3; 
          padding: 2mm; 
          margin: 0;
          width: 58mm;
        }
        .page { 
          width: 100%; 
          margin: 0;
          padding: 0;
        }
        .center { 
          text-align: center; 
        }

        /* Header */
        .restaurant-name-top { 
          font-size: 11px; 
          font-weight: 900; 
          margin-bottom: 1px; 
        }
        .tagline { 
          font-size: 7.5px; 
          margin-bottom: 3px; 
        }

        /* Logo */
        .logo-wrapper { 
          height: 24px; 
          margin: 3px auto; 
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .logo {
          width: 42px;
          height: 22px;
          object-fit: contain;
          margin: 0 auto;
          display: block;
        }

        /* Branch Info */
        .branch-name { 
          font-size: 10px; 
          font-weight: 700; 
          margin: 2px 0 1px 0; 
        }
        .address-line { 
          font-size: 7.5px; 
          line-height: 1.3; 
          margin: 0; 
        }

        /* Dividers */
        .divider-full { 
          border-bottom: 2px solid #000; 
          margin: 2px 0; 
        }
        .divider-thin { 
          border-bottom: 1px solid #000; 
          margin: 2px 0; 
        }

        /* KOT Code */
        .kot-block { 
          font-size: 10px; 
          font-weight: 700; 
          text-align: center; 
          margin: 1px 0; 
        }

        /* Bill Info */
        .bill-info { 
          font-size: 9px; 
          font-weight: 500;
          margin: 0.5px 0; 
          line-height: 1.4; 
        }

        /* Items Table */
        .items-header { 
          display: flex; 
          font-weight: 700; 
          border-bottom: 1px solid #000; 
          padding: 1.5px 0; 
          font-size: 9px; 
          margin-top: 1px; 
        }
        .item-row { 
          display: flex; 
          margin: 1px 0; 
          font-size: 9px; 
          font-weight: 500;
          line-height: 1.3; 
        }
        .col-desc { 
          flex: 2.2; 
          padding-right: 2px; 
        }
        .col-qty { 
          flex: 0.7; 
          text-align: center; 
        }
        .col-rate { 
          flex: 0.9; 
          text-align: right; 
          padding-right: 2px; 
        }
        .col-amt { 
          flex: 0.9; 
          text-align: right; 
        }

        /* Totals */
        .totals { 
          margin-top: 2px; 
          border-top: 1px solid #000; 
          padding-top: 2px; 
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          font-size: 9px; 
          font-weight: 500;
          margin: 0.5px 0; 
          line-height: 1.4; 
        }
        .grand-total { 
          border-top: 1px solid #000; 
          padding-top: 2px; 
          font-size: 10px; 
          font-weight: 900; 
          margin-top: 2px; 
          display: flex; 
          justify-content: space-between; 
        }

        /* GST Block */
        .gst-block { 
          font-size: 7px; 
          text-align: center; 
          margin: 1px 0; 
          line-height: 1.3; 
        }
        .gst-line {
          margin: 1px 0;
        }

        /* Footer */
        .footer { 
          font-size: 8px; 
          text-align: center; 
          margin-top: 2px; 
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
