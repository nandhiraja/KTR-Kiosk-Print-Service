const { execSync } = require('child_process');
const os = require('os');

/**
 * Get detailed printer information on Windows
 */
class PrinterInfo {
    /**
     * Get list of all printers from Windows
     */
    static getAllPrinters() {
        if (os.platform() !== 'win32') {
            return {
                available: false,
                reason: 'Printer detection only available on Windows',
                printers: []
            };
        }

        try {
            // Use WMIC to get printer information
            const command = 'wmic printer get Name,Default,Status,Network,PortName,DriverName /format:csv';
            const output = execSync(command, {
                encoding: 'utf8',
                timeout: 5000,
                windowsHide: true
            });

            const printers = this.parseWmicOutput(output);

            return {
                available: true,
                count: printers.length,
                printers: printers,
                defaultPrinter: printers.find(p => p.isDefault) || null
            };
        } catch (error) {
            return {
                available: false,
                reason: `Failed to retrieve printer information: ${error.message}`,
                printers: []
            };
        }
    }

    /**
     * Get default printer
     */
    static getDefaultPrinter() {
        if (os.platform() !== 'win32') {
            return null;
        }

        try {
            const command = 'wmic printer where default=true get Name,PortName,DriverName,Status /format:csv';
            const output = execSync(command, {
                encoding: 'utf8',
                timeout: 5000,
                windowsHide: true
            });

            const printers = this.parseWmicOutput(output);
            return printers.length > 0 ? printers[0] : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if Print Spooler service is running
     */
    static getPrintSpoolerStatus() {
        if (os.platform() !== 'win32') {
            return { available: false };
        }

        try {
            const output = execSync('sc query spooler', {
                encoding: 'utf8',
                timeout: 3000,
                windowsHide: true
            });

            const isRunning = output.includes('RUNNING');
            const state = output.match(/STATE\s*:\s*\d+\s+(\w+)/);

            return {
                available: true,
                running: isRunning,
                state: state ? state[1] : 'UNKNOWN'
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Parse WMIC CSV output
     */
    static parseWmicOutput(csvOutput) {
        const lines = csvOutput.trim().split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            return [];
        }

        // First line is headers
        const headers = lines[0].split(',').map(h => h.trim());

        // Find column indices (case-insensitive)
        const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');
        const defaultIdx = headers.findIndex(h => h.toLowerCase() === 'default');
        const statusIdx = headers.findIndex(h => h.toLowerCase() === 'status');
        const networkIdx = headers.findIndex(h => h.toLowerCase() === 'network');
        const portIdx = headers.findIndex(h => h.toLowerCase() === 'portname');
        const driverIdx = headers.findIndex(h => h.toLowerCase() === 'drivername');

        const printers = [];

        // Parse each printer (skip header row)
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());

            // Skip empty lines or lines with no name
            if (parts.length < 2 || !parts[nameIdx]) {
                continue;
            }

            const printer = {
                name: parts[nameIdx] || 'Unknown',
                isDefault: parts[defaultIdx]?.toLowerCase() === 'true',
                status: parts[statusIdx] || 'Unknown',
                isNetwork: parts[networkIdx]?.toLowerCase() === 'true',
                port: parts[portIdx] || 'Unknown',
                driver: parts[driverIdx] || 'Unknown'
            };

            printers.push(printer);
        }

        return printers;
    }

    /**
     * Get comprehensive printer diagnostics
     */
    static getDiagnostics() {
        const allPrinters = this.getAllPrinters();
        const spoolerStatus = this.getPrintSpoolerStatus();

        return {
            platform: os.platform(),
            printerSystem: {
                available: allPrinters.available,
                reason: allPrinters.reason,
                printerCount: allPrinters.count || 0,
                hasDefaultPrinter: allPrinters.defaultPrinter !== null
            },
            printers: allPrinters.printers,
            defaultPrinter: allPrinters.defaultPrinter,
            printSpooler: spoolerStatus,
            recommendations: this.getRecommendations(allPrinters, spoolerStatus)
        };
    }

    /**
     * Generate recommendations based on printer status
     */
    static getRecommendations(printerInfo, spoolerStatus) {
        const recommendations = [];

        // Check Print Spooler
        if (spoolerStatus.available && !spoolerStatus.running) {
            recommendations.push({
                severity: 'critical',
                issue: 'Print Spooler service is not running',
                solution: 'Start Print Spooler: net start spooler'
            });
        }

        // Check for default printer
        if (printerInfo.available && !printerInfo.defaultPrinter) {
            recommendations.push({
                severity: 'critical',
                issue: 'No default printer configured',
                solution: 'Set a default printer in Settings > Devices > Printers & scanners'
            });
        }

        // Check if any printers available
        if (printerInfo.available && printerInfo.count === 0) {
            recommendations.push({
                severity: 'critical',
                issue: 'No printers detected',
                solution: 'Connect a printer and install drivers'
            });
        }

        // Check printer status
        if (printerInfo.defaultPrinter && printerInfo.defaultPrinter.status !== 'OK' && printerInfo.defaultPrinter.status !== 'Idle') {
            recommendations.push({
                severity: 'warning',
                issue: `Default printer status: ${printerInfo.defaultPrinter.status}`,
                solution: 'Check printer connection and power'
            });
        }

        // All good
        if (recommendations.length === 0) {
            recommendations.push({
                severity: 'info',
                issue: 'All printer checks passed',
                solution: 'System is ready for printing'
            });
        }

        return recommendations;
    }
}

module.exports = PrinterInfo;
