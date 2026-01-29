const fs = require('fs');
const path = require('path');

/**
 * Simple logger utility for print service
 * Logs to console with timestamps and levels
 */
class Logger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDir();
        this.recentLogs = [];
        this.maxRecentLogs = 50;
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            try {
                fs.mkdirSync(this.logDir, { recursive: true });
            } catch (err) {
                // Fallback to console only if can't create log dir
                console.warn('Could not create log directory:', err.message);
            }
        }
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message) {
        return `[${this.getTimestamp()}] [${level}] ${message}`;
    }

    writeToFile(level, message) {
        try {
            const logFile = path.join(this.logDir, `service-${new Date().toISOString().split('T')[0]}.log`);
            const logLine = this.formatMessage(level, message) + '\n';
            fs.appendFileSync(logFile, logLine);
        } catch (err) {
            // Silently fail - console logging still works
        }
    }

    log(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const formatted = `[${timestamp}] [${level}] ${message}`;
        console.log(formatted);

        if (data) {
            console.log(data);
        }

        this.recentLogs.unshift({
            timestamp,
            level,
            message,
            data
        });

        if (this.recentLogs.length > this.maxRecentLogs) {
            this.recentLogs.pop();
        }

        this.writeToFile(level, message + (data ? ' ' + JSON.stringify(data) : ''));
    }

    info(message, data) {
        this.log('INFO', message, data);
    }

    warn(message, data) {
        this.log('WARN', message, data);
    }

    error(message, data) {
        this.log('ERROR', message, data);
    }

    startup(message) {
        console.log('\n' + '='.repeat(60));
        console.log(`🚀 ${message}`);
        console.log('='.repeat(60) + '\n');
        this.writeToFile('STARTUP', message);
    }

    shutdown(message) {
        console.log('\n' + '='.repeat(60));
        console.log(`🛑 ${message}`);
        console.log('='.repeat(60) + '\n');
        this.writeToFile('SHUTDOWN', message);
    }

    printJob(message) {
        console.log(message);
        this.writeToFile('PRINT', message);
    }

    serviceError(message, error) {
        console.error('\n' + '❌'.repeat(30));
        console.error(`ERROR: ${message}`);
        if (error) {
            console.error(`Message: ${error.message}`);
            console.error(`Stack: ${error.stack}`);
        }
        console.error('❌'.repeat(30) + '\n');

        this.writeToFile('ERROR', `${message} - ${error?.message || ''}`);
    }
    getRecentLogs() {
        return this.recentLogs;
    }
}

// Export singleton instance
module.exports = new Logger();
