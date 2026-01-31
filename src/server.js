const express = require('express');
const cors = require('cors');
const config = require('./config/printer.config');
const logger = require('./utils/logger');
const pathValidator = require('./utils/pathValidator');
const printRoutes = require('./routes/print.routes');
const printService = require('./services/printService');

// ============================================
// Global Error Handlers (CRITICAL FOR WINDOWS SERVICE)
// ============================================

process.on('uncaughtException', (error) => {
    logger.serviceError('UNCAUGHT EXCEPTION - Service will attempt to continue', error);
    // Don't exit - let service auto-restart handle it if needed
});

process.on('unhandledRejection', (reason, promise) => {
    logger.serviceError('UNHANDLED REJECTION', new Error(String(reason)));
    // Don't exit - log and continue
});

// ============================================
// Startup Validation
// ============================================

function validateStartup() {
    const errors = [];

    logger.startup('Running startup validation...');

    // Validate Chrome installation
    if (!config.validation.hasChrome()) {
        errors.push('Chrome not found - install from https://www.google.com/chrome/');
    } else {
        logger.info(`✅ Chrome found at: ${config.validation.getChromePath()}`);
    }

    // Validate project path
    const pathCheck = pathValidator.validateProjectPath(process.cwd());
    if (pathCheck.issues.length > 0) {
        pathCheck.issues.forEach(issue => {
            logger.warn(`Path Issue: ${issue.message}`);
        });
    }

    // Check PDF output directory
    logger.info(`✅ PDF output directory: ${config.PDF_OUTPUT_DIR}`);
    logger.info(`✅ Print mode: ${config.PRINT_MODE}`);
    logger.info(`✅ Port: ${config.PORT}`);

    if (errors.length > 0) {
        logger.serviceError('Startup validation failed', new Error(errors.join(', ')));
        errors.forEach(err => console.error(`  - ${err}`));
        process.exit(1);
    }

    logger.startup('✅ Startup validation passed');
}

// ============================================
// Express App Setup
// ============================================

const app = express();

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for local development
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    logger.info(`${req.method} ${req.url} - ${timestamp}`);
    next();
});

// ============================================
// Routes
// ============================================

// Health check endpoint
app.get('/print/health', async (req, res) => {
    try {
        const health = await printService.healthCheck();
        res.json({
            success: true,
            service: 'Restaurant Kiosk Print Service',
            status: 'running',
            ...health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Print routes
app.use('/print', printRoutes);
app.use('/print/escpos', require('./routes/escpos.routes'));  // ESC/POS test routes
app.use('/', require('./routes/admin.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    logger.serviceError('Express error handler', err);
    res.status(500).json({
        success: false,
        error: err.message
    });
});

// ============================================
// Server Startup
// ============================================

// Run startup validation
validateStartup();

// Start server
const server = app.listen(config.PORT, config.HOST, () => {
    logger.startup('━'.repeat(60));
    logger.startup('🚀 Restaurant Kiosk Print Service');
    logger.startup('━'.repeat(60));
    logger.startup(`✅ Server is RUNNING`);
    logger.startup(`🔗 Admin Dashboard: http://${config.HOST}:${config.PORT}`);
    logger.startup(`🔧 PDF Output: ${config.PDF_OUTPUT_DIR}`);
    logger.startup('━'.repeat(60));
    logger.startup('👉 Open the URL above in your browser to configure printers');
});

// ============================================
// Graceful Shutdown
// ============================================

async function gracefulShutdown(signal) {
    logger.shutdown(`Received ${signal} - starting graceful shutdown...`);

    // Close HTTP server
    server.close(async () => {
        logger.shutdown('HTTP server closed');

        // Cleanup print service
        await printService.cleanup();

        logger.shutdown('✅ Graceful shutdown complete');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.serviceError('Forced shutdown after timeout', new Error('Shutdown timeout'));
        process.exit(1);
    }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export app for testing
module.exports = app;
