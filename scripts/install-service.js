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
console.log('  Installing Windows Service');
console.log('================================================');
console.log('');
console.log(`Service Name: ${SERVICE_NAME}`);
console.log(`Script Path: ${scriptPath}`);
console.log('');

// Create a new service object
const svc = new Service({
    name: SERVICE_NAME,
    description: SERVICE_DESCRIPTION,
    script: scriptPath,
    nodeOptions: [
        '--max-old-space-size=512'
    ],
    env: [{
        name: 'PRINT_MODE',
        value: 'printer' // Change to 'pdf-only' for testing
    }, {
        name: 'PDF_OUTPUT_DIR',
        value: 'C:\\Users\\KIOSK\\Downloads\\KioskPrints' // Explicit path for SYSTEM user
    }],
    // Service will restart on crashes
    maxRetries: 3,
    maxRestarts: 5,
    wait: 2,
    grow: 0.5
});

// Listen for the "install" event
svc.on('install', () => {
    console.log('');
    console.log('✅ Service installed successfully!');
    console.log('');
    console.log('Starting service...');
    svc.start();
});

// Listen for the "start" event
svc.on('start', () => {
    console.log('');
    console.log('✅ Service started successfully!');
    console.log('');
    console.log('================================================');
    console.log('  Service is now running');
    console.log('================================================');
    console.log('');
    console.log(`Service Name: ${SERVICE_NAME}`);
    console.log('Port: http://localhost:9100');
    console.log('');
    console.log('Test it: http://localhost:9100/print/health');
    console.log('');
    console.log('Commands:');
    console.log(`  Start:  net start ${SERVICE_NAME}`);
    console.log(`  Stop:   net stop ${SERVICE_NAME}`);
    console.log(`  Status: sc query ${SERVICE_NAME}`);
    console.log('');
});

// Listen for errors
svc.on('error', (err) => {
    console.error('');
    console.error('❌ Service installation error:');
    console.error(err.message);
    console.error('');
    process.exit(1);
});

// Check if service already exists
svc.on('alreadyinstalled', () => {
    console.log('');
    console.log('⚠️  Service is already installed!');
    console.log('');
    console.log('To reinstall:');
    console.log('  1. Run UNINSTALL.bat first');
    console.log('  2. Then run INSTALL.bat again');
    console.log('');
    process.exit(0);
});

// Install the service
console.log('Installing service...');
svc.install();
