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
            printerName: null, // null means default system printer
            // Print Layout Settings
            printLayout: {
                scale: 1.0,           // Let CSS handle sizing - no scaling
                pageWidth: '58mm',    // Paper width
                marginTop: '0mm',
                marginRight: '0mm',
                marginBottom: '0mm',
                marginLeft: '0mm'
            }
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

    // Printer Name Methods
    getPrinterName() {
        return this.settings.printerName;
    }

    setPrinterName(name) {
        this.settings.printerName = name;
        return this.saveSettings();
    }

    // Print Layout Methods
    getPrintLayout() {
        if (!this.settings.printLayout) {
            this.settings.printLayout = this.getDefaultSettings().printLayout;
        }
        return this.settings.printLayout;
    }

    setPrintLayout(layout) {
        this.settings.printLayout = {
            ...this.getPrintLayout(),
            ...layout
        };
        return this.saveSettings();
    }

    getScale() {
        return this.getPrintLayout().scale;
    }

    setScale(scale) {
        const layout = this.getPrintLayout();
        layout.scale = parseFloat(scale);
        return this.saveSettings();
    }

    getPageWidth() {
        return this.getPrintLayout().pageWidth;
    }

    setPageWidth(width) {
        const layout = this.getPrintLayout();
        layout.pageWidth = width;
        return this.saveSettings();
    }

    getMargins() {
        const layout = this.getPrintLayout();
        return {
            top: layout.marginTop,
            right: layout.marginRight,
            bottom: layout.marginBottom,
            left: layout.marginLeft
        };
    }

    setMargins(margins) {
        const layout = this.getPrintLayout();
        if (margins.top !== undefined) layout.marginTop = margins.top;
        if (margins.right !== undefined) layout.marginRight = margins.right;
        if (margins.bottom !== undefined) layout.marginBottom = margins.bottom;
        if (margins.left !== undefined) layout.marginLeft = margins.left;
        return this.saveSettings();
    }

    getAll() {
        return this.settings;
    }
}

module.exports = new SettingsManager();
