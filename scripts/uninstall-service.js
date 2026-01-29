const Service = require('node-windows').Service;
const path = require('path');

// ============================================
// SERVICE CONFIGURATION
// ============================================

const SERVICE_NAME = 'KioskPrintService';
const SERVICE_DESCRIPTION = 'Restaurant Kiosk Print Service - Handles silent printing for bills and KOTs';

// Get the absolute path to server.js
const scriptPath = path.join(__dirname, '..', 'src', 'server.js');

console.log('================================================');
console.log('  Uninstalling Windows Service');
console.log('================================================');
console.log('');
console.log(`Service Name: ${SERVICE_NAME}`);
console.log(`Script Path: ${scriptPath}`);
console.log('');

// Create a new service object
const svc = new Service({
    name: SERVICE_NAME,
    description: SERVICE_DESCRIPTION,
    script: scriptPath
});

// Listen for the "uninstall" event
svc.on('uninstall', () => {
    console.log('');
    console.log('✅ Service uninstalled successfully!');
    console.log('');
    console.log('================================================');
    console.log('  Service removed from Windows');
    console.log('================================================');
    console.log('');
    console.log('The service has been removed from your system.');
    console.log('Project files remain in this folder.');
    console.log('');
    console.log('To reinstall, run INSTALL.bat');
    console.log('');
});

// Listen for errors
svc.on('error', (err) => {
    console.error('');
    console.error('❌ Service uninstallation error:');
    console.error(err.message);
    console.error('');

    // If error is "not installed", that's actually fine
    if (err.message && err.message.includes('not installed')) {
        console.log('Service was not installed - nothing to uninstall.');
        console.log('');
        process.exit(0);
    } else {
        process.exit(1);
    }
});

// Listen for "doesnotexist" event
svc.on('invalidinstallation', () => {
    console.log('');
    console.log('ℹ️  Service is not installed.');
    console.log('');
    console.log('Nothing to uninstall!');
    console.log('');
    process.exit(0);
});

// Uninstall the service
console.log('Uninstalling service...');
svc.uninstall();
