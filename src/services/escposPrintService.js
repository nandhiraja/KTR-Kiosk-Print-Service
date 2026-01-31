const settingsManager = require('../config/settingsManager');
const logger = require('../utils/logger');

/**
 * ESC/POS Print Service
 * Direct thermal printer communication - much faster than PDF approach
 */
class ESCPOSPrintService {
    constructor() {
        this.printCount = 0;
        this.initTime = Date.now();
        logger.info('ESC/POS PrintService initialized');
    }

    /**
     * Print using ESC/POS commands (direct to thermal printer)
     */
    async printESCPOS(printerObject, documentTitle = 'Print_Job') {
        const startTime = Date.now();
        this.printCount++;

        const jobNumber = this.printCount;

        logger.printJob(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        logger.printJob(`Job #${jobNumber}: ${documentTitle} (ESC/POS)`);
        logger.printJob(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        try {
            // Get printer name from settings
            const printerName = settingsManager.getPrinterName() || 'default';

            // Configure printer
            printerObject.config.interface = printerName === 'default'
                ? 'printer'
                : `printer:${printerName}`;

            // Execute print command
            await printerObject.execute();

            const duration = Date.now() - startTime;
            logger.printJob(`✅ Printed successfully: ${documentTitle}`);
            logger.printJob(`✅ Job #${jobNumber} completed in ${duration}ms`);
            logger.printJob(`Total jobs this session: ${this.printCount}`);

            return {
                success: true,
                jobNumber,
                duration,
                method: 'ESC/POS'
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.serviceError(`Print job #${jobNumber} FAILED: ${documentTitle}`, error);

            return {
                success: false,
                error: error.message,
                jobNumber,
                duration
            };
        }
    }

    /**
     * Get service statistics
     */
    getStats() {
        return {
            totalPrints: this.printCount,
            uptime: Date.now() - this.initTime,
            method: 'ESC/POS Direct Printing'
        };
    }
}

module.exports = new ESCPOSPrintService();
