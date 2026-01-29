const path = require('path');
const os = require('os');
const validation = require('../utils/validation');

// Detect Chrome path automatically
const chromePath = validation.getChromePath();

module.exports = {
    // Server configuration
    PORT: process.env.PORT || 9100,
    HOST: 'localhost', // Only bind to localhost for security

    // Print mode: 'pdf-only' or 'printer'
    // pdf-only: Generates and saves PDFs only (testing/development)
    // printer: Generates PDFs and sends to thermal printer (production)
    // IMPORTANT: Service install script sets this to 'printer' by default
    // Change to 'pdf-only' if you want to test without actual printing
    // Print mode: 'pdf-only' or 'printer'
    // pdf-only: Generates and saves PDFs only (testing/development)
    // printer: Generates PDFs and sends to thermal printer (production)
    PRINT_MODE: process.env.PRINT_MODE || 'printer',

    // PDF output directory
    // IMPORTANT: When running as Windows Service (SYSTEM user), os.homedir() 
    // returns C:\WINDOWS\system32\config\systemprofile which is not accessible 
    // to normal users. Set explicit path or use PDF_OUTPUT_DIR env variable.
    // PDF output directory
    // Uses the current user's Downloads folder by default to avoid permission issues
    PDF_OUTPUT_DIR: process.env.PDF_OUTPUT_DIR || path.join(os.homedir(), 'Downloads', 'KioskPrints'),

    // Chrome executable path (auto-detected or from environment)
    CHROME_PATH: process.env.CHROME_PATH || chromePath,

    // Printer settings for 58mm thermal printer (Roll Paper)
    PRINTER_CONFIG: {
        // Page settings
        format: 'A4', // Will be overridden by CSS @page
        width: '58mm',
        margin: {
            top: '0mm',
            right: '0mm',
            bottom: '0mm',
            left: '0mm'
        },

        // Print settings
        printBackground: true,
        preferCSSPageSize: true,

        // Scale and quality - INCREASED to 1.4 to zoom in for thermal printer
        scale: 1.4,  // Scale up entire page by 40% for thermal paper readability
        displayHeaderFooter: false
    },

    // Puppeteer settings
    PUPPETEER_CONFIG: {
        headless: 'new',
        executablePath: process.env.CHROME_PATH || chromePath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--no-first-run',
            '--no-default-browser-check'
        ]
    },

    // pdf-to-printer configuration (for actual printing)
    // Printer name is now handled dynamically via SettingsManager
    PDF_TO_PRINTER_CONFIG: {
        printer: undefined, // undefined = default printer (will be overridden)
        silent: true,
        options: {
            scale: 'fit',
            orientation: 'portrait'
        }
    },

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',

    // Timeouts (in milliseconds)
    PRINT_TIMEOUT: 30000, // 30 seconds
    PAGE_LOAD_TIMEOUT: 10000, // 10 seconds

    // Validation utilities
    validation: {
        hasChrome: validation.hasChrome,
        getChromePath: validation.getChromePath,
        hasSumatraPDF: validation.hasSumatraPDF,
        getSumatraPath: validation.getSumatraPath,
        validateSystem: validation.validateSystem,
        getValidationSummary: validation.getValidationSummary
    }
};
