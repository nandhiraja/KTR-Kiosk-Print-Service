const express = require('express');
const router = express.Router();
const path = require('path');
const pdfPrinter = require('pdf-to-printer');
const settingsManager = require('../config/settingsManager');
const logger = require('../utils/logger');
const printService = require('../services/printService');

// Serve Admin Dashboard
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/admin_dashboard.html'));
});

// API: Get Service Status
router.get('/api/status', (req, res) => {
    const stats = printService.getStats();
    res.json({
        status: 'running',
        ...stats
    });
});

// API: Get Available Printers
router.get('/api/printers', async (req, res) => {
    try {
        const printers = await pdfPrinter.getPrinters();
        const currentPrinter = settingsManager.getPrinterName();

        // Normalize printer data - pdf-to-printer might return strings or objects
        const normalizedPrinters = printers.map(p => {
            // If it's already an object with a name, return as-is
            if (typeof p === 'object' && p.name) {
                return p;
            }
            // If it's a string, wrap it in an object
            if (typeof p === 'string') {
                return { name: p };
            }
            // If it's an object without name but has deviceId or other properties
            return { name: p.deviceId || p.displayName || 'Unknown Printer' };
        });

        res.json({
            success: true,
            currentPrinter: currentPrinter,
            printers: normalizedPrinters
        });
    } catch (error) {
        // Fallback for non-Windows or if library missing
        res.status(500).json({
            success: false,
            error: error.message,
            printers: []
        });
    }
});

// API: Set Printer
router.post('/api/settings/printer', (req, res) => {
    const { printerName } = req.body;

    // Allow setting to null (default printer) or a specific string
    if (settingsManager.setPrinterName(printerName)) {
        logger.info(`Configuration updated: Printer set to ${printerName || 'System Default'}`);
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false, error: 'Failed to save settings' });
    }
});

// API: Get Recent Logs
router.get('/api/logs', (req, res) => {
    const logs = logger.getRecentLogs();
    res.json({ logs });
});

module.exports = router;
