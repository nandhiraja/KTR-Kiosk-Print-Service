const Service = require('node-windows').Service;
const path = require('path');
const logger = require('../src/utils/logger');

// Create a new service object
const svc = new Service({
    name: 'RestaurantKioskPrintService',
    description: 'Background Print Service for Restaurant Kiosk (Bills & KOTs)',
    script: path.join(__dirname, '../src/server.js'),
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ],
    // workingDirectory: '...' // Optional: defaults to script directory
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
    logger.startup('Service installed successfully');
    svc.start();
    logger.startup('Service started automatically');
});

// Listen for the "alreadyinstalled" event
svc.on('alreadyinstalled', function () {
    logger.warn('Service is already installed');

    // Optional: Uninstall and reinstall to update
    // svc.uninstall();
});

// Listen for the "start" event
svc.on('start', function () {
    logger.info('Service started');
});

// Listen for the "stop" event
svc.on('stop', function () {
    logger.info('Service stopped');
});

// Install the script
logger.startup('Installing Windows Service...');
svc.install();
