const express = require('express');
const printService = require('../services/printService');
const generateKOTBill = require('../templates/kotBill');
const generateRestaurantBill = require('../templates/restaurantBill');
const generateFoodKOT = require('../templates/foodKOT');
const generateCoffeeKOT = require('../templates/coffeeKOT');

const router = express.Router();

/**
 * POST /print/bill
 * Print full restaurant bill
 */
router.post('/bill', async (req, res) => {
    try {
        const { orderId, kot_code, KDSInvoiceId, orderDetails, orderType, transactionDetails, whatsappNumber } = req.body;

        // Validate required fields
        if (!orderId || !kot_code || !orderDetails) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: orderId, kot_code, orderDetails'
            });
        }

        console.log(`[BILL] Printing bill for order: ${orderId}`);

        // Generate HTML
        const html = generateRestaurantBill(
            orderId,
            kot_code,
            KDSInvoiceId,
            orderDetails,
            orderType,
            transactionDetails,
            whatsappNumber
        );

        // Print
        await printService.printHTML(html, `Bill-${orderId}`);

        res.json({
            success: true,
            message: 'Bill printed successfully',
            orderId
        });
    } catch (error) {
        console.error('[BILL] Print error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /print/kot
 * Print general KOT (all items)
 */
router.post('/kot', async (req, res) => {
    try {
        const { orderId, kot_code, KDSInvoiceId, orderDetails } = req.body;

        if (!orderId || !kot_code || !orderDetails) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: orderId, kot_code, orderDetails'
            });
        }

        console.log(`[KOT] Printing KOT: ${kot_code}`);

        const html = generateKOTBill(orderId, kot_code, KDSInvoiceId, orderDetails);
        await printService.printHTML(html, `KOT-${kot_code}`);

        res.json({
            success: true,
            message: 'KOT printed successfully',
            kot_code
        });
    } catch (error) {
        console.error('[KOT] Print error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /print/food-kot
 * Print food KOT (non-coffee items only)
 */
router.post('/food-kot', async (req, res) => {
    try {
        const { orderId, kot_code, KDSInvoiceId, orderDetails } = req.body;

        if (!orderId || !kot_code || !orderDetails) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: orderId, kot_code, orderDetails'
            });
        }

        console.log(`[FOOD-KOT] Printing food KOT: ${kot_code}`);

        const html = generateFoodKOT(orderId, kot_code, KDSInvoiceId, orderDetails);

        // Check if there are food items
        if (!html) {
            return res.json({
                success: true,
                message: 'No food items to print',
                skipped: true
            });
        }

        await printService.printHTML(html, `Food-KOT-${kot_code}`);

        res.json({
            success: true,
            message: 'Food KOT printed successfully',
            kot_code
        });
    } catch (error) {
        console.error('[FOOD-KOT] Print error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /print/coffee-kot
 * Print coffee KOT (coffee items only)
 */
router.post('/coffee-kot', async (req, res) => {
    try {
        const { orderId, kot_code, KDSInvoiceId, orderDetails } = req.body;

        if (!orderId || !kot_code || !orderDetails) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: orderId, kot_code, orderDetails'
            });
        }

        console.log(`[COFFEE-KOT] Printing coffee KOT: ${kot_code}`);

        const html = generateCoffeeKOT(orderId, kot_code, KDSInvoiceId, orderDetails);

        // Check if there are coffee items
        if (!html) {
            return res.json({
                success: true,
                message: 'No coffee items to print',
                skipped: true
            });
        }

        await printService.printHTML(html, `Coffee-KOT-${kot_code}`);

        res.json({
            success: true,
            message: 'Coffee KOT printed successfully',
            kot_code
        });
    } catch (error) {
        console.error('[COFFEE-KOT] Print error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'Restaurant Kiosk Print Service',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
