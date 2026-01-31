const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const config = require('../config/printer.config');
const logger = require('../utils/logger');
const PrinterInfo = require('../utils/printerInfo');
const settingsManager = require('../config/settingsManager');
const { execFile } = require('child_process');
const os = require('os');

// Import pdf-to-printer (optional - graceful fallback if not available)
let pdfPrinter = null;
try {
    pdfPrinter = require('pdf-to-printer');
} catch (err) {
    logger.warn('pdf-to-printer not available - printer mode will be disabled');
}

/**
 * Print Service - Handles HTML to PDF to Printer workflow
 */
class PrintService {
    constructor() {
        this.browser = null;
        this.printCount = 0;
        this.initTime = Date.now();

        // Ensure PDF output directory exists
        this.pdfOutputDir = config.PDF_OUTPUT_DIR;
        this.ensureDirectory(this.pdfOutputDir);

        logger.startup(`PrintService initialized in ${config.PRINT_MODE} mode`);
        logger.info(`PDF output directory: ${this.pdfOutputDir}`);

        // SPEED OPTIMIZATION: Pre-warm browser on startup for instant first print
        this.prewarmBrowser();
    }

    /**
     * Pre-warm browser (initializes in background on startup)
     */
    async prewarmBrowser() {
        setTimeout(async () => {
            try {
                await this.init();
                logger.info('✅ Browser pre-warmed and ready for instant printing');
            } catch (err) {
                logger.warn('Browser pre-warm failed - will initialize on first print');
            }
        }, 2000); // Start after 2 seconds to avoid blocking service startup
    }

    /**
     * Ensure directory exists
     */
    ensureDirectory(dir) {
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
                logger.info(`Created directory: ${dir}`);
            } catch (err) {
                logger.serviceError(`Failed to create directory: ${dir}`, err);
                throw err;
            }
        }
    }

    /**
     * Validate Chrome is available
     */
    validateChrome() {
        if (!config.validation.hasChrome()) {
            const error = new Error(
                'Chrome not found! Service requires Chrome to be installed system-wide.\\n' +
                'Install Chrome from: https://www.google.com/chrome/\\n' +
                'Or set CHROME_PATH environment variable.'
            );
            logger.serviceError('Chrome validation failed', error);
            throw error;
        }

        logger.info(`Chrome found at: ${config.validation.getChromePath()}`);
        return true;
    }

    /**
     * Initialize browser (keeps alive for multiple print jobs)
     */
    async init() {
        if (!this.browser || !this.browser.isConnected()) {
            this.validateChrome();

            logger.startup('Initializing Puppeteer browser...');

            try {
                this.browser = await puppeteer.launch({
                    ...config.PUPPETEER_CONFIG,
                    // Keep browser alive for faster subsequent prints
                    timeout: 60000
                });
                logger.startup('✅ Browser initialized successfully');
            } catch (err) {
                logger.serviceError('Failed to launch browser', err);
                throw new Error(
                    `Puppeteer launch failed: ${err.message}\\n` +
                    `Chrome path: ${config.CHROME_PATH || 'NOT FOUND'}\\n` +
                    `Ensure Chrome is installed system-wide.`
                );
            }
        }
        return this.browser;
    }

    /**
     * Generate PDF from HTML (optimized for speed)
     */
    async generatePDF(htmlContent, documentTitle) {
        await this.init();

        logger.printJob(`Generating PDF: ${documentTitle}`);

        const page = await this.browser.newPage();

        try {
            // SPEED OPTIMIZATION: Use domcontentloaded and minimal timeout
            await page.setContent(htmlContent, {
                waitUntil: 'domcontentloaded',  // Don't wait for network - static HTML only
                timeout: 5000  // Reduced to 5 seconds - should be instant for static HTML
            });

            // Get dynamic settings
            const layout = settingsManager.getPrintLayout();

            // CRITICAL FIX: Let CSS @page control everything, just like browser print!
            // Don't override with Puppeteer settings - that's what causes white space
            const pdfBuffer = await page.pdf({
                // Remove format, width, margin - let CSS @page handle it
                printBackground: true,
                preferCSSPageSize: true,  // MUST be true to respect @page
                scale: layout.scale,       // Only apply scale from settings
                displayHeaderFooter: false,
                timeout: 10000
            });

            logger.info(`PDF generated: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

            return pdfBuffer;
        } finally {
            // Close page immediately to free resources
            await page.close();
        }
    }

    /**
     * Save PDF to disk
     */
    savePDF(pdfBuffer, fileName) {
        const filePath = path.join(this.pdfOutputDir, fileName);

        try {
            fs.writeFileSync(filePath, pdfBuffer);

            // Verify file creation
            if (!fs.existsSync(filePath)) {
                throw new Error('PDF file was not created');
            }

            const fileStats = fs.statSync(filePath);
            logger.info(`PDF saved: ${filePath} (${(fileStats.size / 1024).toFixed(2)} KB)`);

            return filePath;
        } catch (err) {
            logger.serviceError(`Failed to save PDF: ${filePath}`, err);
            throw err;
        }
    }

    /**
     * Send PDF to printer
     */


    // ... existing code ...

    /**
     * Send PDF to printer
     */
    /**
     * Send PDF to printer
     */
    async sendToPrinter(filePath, documentTitle) {
        try {
            const printerName = settingsManager.getPrinterName();
            logger.printJob(`Sending to printer: ${documentTitle} (Target: ${printerName || 'Default'})`);

            // 1. Ensure SumatraPDF is available on disk (extracted from pkg if needed)
            const sumatraPath = await this.ensureSumatraPDF();

            // 2. Construct arguments for SumatraPDF
            // Usage: -print-to "Printer Name" -silent "file.pdf"
            const args = [];
            if (printerName) {
                args.push('-print-to', printerName);
            } else {
                args.push('-print-to-default');
            }
            args.push('-silent');
            args.push(filePath);

            // 3. Execute printing
            return new Promise((resolve, reject) => {
                execFile(sumatraPath, args, (error, stdout, stderr) => {
                    if (error) {
                        logger.serviceError(`Printer error for ${documentTitle}`, error);
                        resolve(false);
                    } else {
                        logger.printJob(`✅ Printed successfully: ${documentTitle}`);
                        resolve(true);
                    }
                });
            });

        } catch (err) {
            logger.serviceError(`Printer instantiation error for ${documentTitle}`, err);
            return false;
        }
    }

    /**
     * Ensure SumatraPDF executable exists on the file system
     * Returns path to the executable
     */
    async ensureSumatraPDF() {
        const tmpDir = os.tmpdir();
        const destPath = path.join(tmpDir, 'SumatraPDF-Kiosk.exe');

        // If it already exists in temp, return it
        if (fs.existsSync(destPath)) {
            return destPath;
        }

        logger.info('Extracting SumatraPDF to temp directory...');

        // Locate source in snapshot
        // When packaged, __dirname is inside snapshot. 
        // We need to find where pkg put node_modules.
        // Usually: /snapshot/project/node_modules/pdf-to-printer/dist/SumatraPDF.exe

        let sourcePath = '';

        if (process.pkg) {
            // Try standard pkg structure
            sourcePath = path.join(__dirname, '../../node_modules/pdf-to-printer/dist/SumatraPDF.exe');
        } else {
            // Dev environment
            sourcePath = path.join(process.cwd(), 'node_modules/pdf-to-printer/dist/SumatraPDF.exe');
        }

        try {
            // Check if source exists
            if (!fs.existsSync(sourcePath)) {
                // Try alternative location for pkg
                sourcePath = path.join(path.dirname(process.execPath), 'SumatraPDF.exe'); // Next to EXE?
                if (!fs.existsSync(sourcePath)) {
                    throw new Error(`SumatraPDF not found at ${sourcePath}`);
                }
            }

            // Copy file
            fs.copyFileSync(sourcePath, destPath);
            logger.info(`Extracted SumatraPDF to: ${destPath}`);
            return destPath;
        } catch (err) {
            logger.serviceError('Failed to extract SumatraPDF', err);
            // Fallback: expect it adjacent to the executable
            return 'SumatraPDF.exe';
        }
    }

    /**
     * Get safe filename from document title
     */
    getSafeFileName(documentTitle) {
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .split('.')[0];

        const safeTitle = documentTitle.replace(/[^a-zA-Z0-9]/g, '_');
        return `${safeTitle}_${timestamp}.pdf`;
    }

    /**
     * Main print function - HTML to PDF to Printer
     */
    async printHTML(htmlContent, documentTitle = 'Print_Job') {
        const startTime = Date.now();
        this.printCount++;

        const jobNumber = this.printCount;
        const fileName = this.getSafeFileName(documentTitle);

        logger.printJob(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        logger.printJob(`Job #${jobNumber}: ${documentTitle}`);
        logger.printJob(`Mode: ${config.PRINT_MODE}`);
        logger.printJob(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        try {
            // Step 1: Generate PDF
            const pdfBuffer = await this.generatePDF(htmlContent, documentTitle);

            // Step 2: Save PDF to disk
            const filePath = this.savePDF(pdfBuffer, fileName);

            // Step 3: Send to printer (if in printer mode)
            let printedToDevice = false;

            if (config.PRINT_MODE === 'printer') {
                printedToDevice = await this.sendToPrinter(filePath, documentTitle);
            } else {
                logger.info('Running in pdf-only mode - skipping printer');
            }

            const duration = Date.now() - startTime;
            logger.printJob(`✅ Job #${jobNumber} completed in ${duration}ms`);
            logger.printJob(`Total jobs this session: ${this.printCount}`);

            return {
                success: true,
                jobNumber,
                pdfSaved: true,
                printedToDevice,
                pdfPath: filePath,
                fileName,
                duration,
                mode: config.PRINT_MODE
            };

        } catch (error) {
            logger.serviceError(`Print job #${jobNumber} FAILED: ${documentTitle}`, error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cleanup browser
     */
    async cleanup() {
        if (this.browser) {
            logger.shutdown('Closing browser...');
            try {
                await this.browser.close();
                this.browser = null;
                logger.shutdown('Browser closed');
            } catch (err) {
                logger.serviceError('Error closing browser', err);
            }
        }
    }

    /**
     * Get service statistics
     */
    getStats() {
        return {
            printCount: this.printCount,
            browserActive: this.browser !== null,
            pdfOutputDir: this.pdfOutputDir,
            printMode: config.PRINT_MODE,
            uptime: Date.now() - this.initTime,
            hasPrinter: pdfPrinter !== null,
            hasChrome: config.validation.hasChrome(),
            chromePath: config.validation.getChromePath()
        };
    }

    /**
     * Health check with detailed printer diagnostics
     */
    async healthCheck() {
        const stats = this.getStats();
        const issues = [];

        // Check Chrome
        if (!stats.hasChrome) {
            issues.push('Chrome not found');
        }

        // Check pdf-to-printer module
        if (config.PRINT_MODE === 'printer' && !stats.hasPrinter) {
            issues.push('pdf-to-printer module not available');
        }

        // Get detailed printer diagnostics
        const printerDiagnostics = PrinterInfo.getDiagnostics();

        // Add printer-related issues
        if (config.PRINT_MODE === 'printer') {
            if (!printerDiagnostics.printSpooler.running) {
                issues.push('Print Spooler service not running');
            }
            if (!printerDiagnostics.printerSystem.hasDefaultPrinter) {
                issues.push('No default printer configured');
            }
            if (printerDiagnostics.printerSystem.printerCount === 0) {
                issues.push('No printers detected');
            }
        }

        return {
            healthy: issues.length === 0,
            issues,
            stats,
            printerDiagnostics
        };
    }
}

// Export singleton instance
module.exports = new PrintService();
