const fs = require('fs');
const path = require('path');

class SettingsManager {
    constructor() {
        this.configPath = path.join(process.cwd(), 'settings.json');
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return this.getDefaultSettings();
    }

    getDefaultSettings() {
        return {
            printerName: null // null means default system printer
        };
    }

    saveSettings() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.settings, null, 4));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    getPrinterName() {
        return this.settings.printerName;
    }

    setPrinterName(name) {
        this.settings.printerName = name;
        return this.saveSettings();
    }

    getAll() {
        return this.settings;
    }
}

module.exports = new SettingsManager();
