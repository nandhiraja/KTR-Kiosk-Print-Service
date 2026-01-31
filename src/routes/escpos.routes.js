const express = require('express');
const router = express.Router();
const escposPrintService = require('../services/escposPrintService');
const generateRestaurantBillESCPOS = require('../templates/escpos/restaurantBill');
const logger = require('../utils/logger');

/**
 * ESC/POS Test Routes
 * These run in parallel with existing PDF routes for comparison
 */

/**
 * POST /print/escpos/bill
 * Print restaurant bill using ESC/POS (direct thermal printing)
 */
router.post('/bill', async (req, res) => {
    try {
        const { orderId, kot_code, KDSInvoiceId, orderDetails, orderType, transactionDetails, whatsappNumber } = req.body;

        logger.info(`POST /print/escpos/bill - ${new Date().toISOString()}`);
        logger.printJob(`[ESCPOS-BILL] Printing bill for order: ${orderId}`);

        // Generate ESC/POS printer object
        const printer = generateRestaurantBillESCPOS(
            orderId,
            kot_code,
            KDSInvoiceId,
            orderDetails,
            orderType,
            transactionDetails,
            whatsappNumber
        );

        // Execute print
        const result = await escposPrintService.printESCPOS(printer, `Bill-${orderId}`);

        if (result.success) {
            res.json({
                success: true,
                message: `Bill printed successfully (ESC/POS)`,
                jobNumber: result.jobNumber,
                duration: result.duration,
                method: 'ESC/POS',
                orderId
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                orderId
            });
        }

    } catch (error) {
        logger.serviceError('[ESCPOS-BILL] Print error', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /print/escpos/test
 * Test ESC/POS printing with sample data
 */
router.get('/test', async (req, res) => {
    try {
        const testData = {
            orderId: 'KTR-TESTORDER123',
            kot_code: 'KTR-10',
            KDSInvoiceId: 'KDS123',
            orderDetails: {
                items: [
                    { itemName: 'Idli (2 pcs)', quantity: 1, price: 40 },
                    { itemName: 'Masala Dosa', quantity: 1, price: 80 },
                    { itemName: 'Filter Coffee', quantity: 2, price: 30 }
                ],
                subtotal: 180,
                tax: 9,
                total: 189,
                billType: 'DINE IN',
                kiosk: 'KTR1'
            },
            orderType: 'DINE IN',
            transactionDetails: {
                paymentMethod: 'CASH'
            },
            whatsappNumber: ''
        };

        const printer = generateRestaurantBillESCPOS(
            testData.orderId,
            testData.kot_code,
            testData.KDSInvoiceId,
            testData.orderDetails,
            testData.orderType,
            testData.transactionDetails,
            testData.whatsappNumber
        );

        const result = await escposPrintService.printESCPOS(printer, 'Test-Bill');

        res.json({
            success: true,
            message: 'Test print completed',
            result
        });

    } catch (error) {
        logger.serviceError('[ESCPOS-TEST] Error', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
