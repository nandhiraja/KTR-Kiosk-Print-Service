const fs = require('fs');
const path = require('path');

/**
 * Convert image to base64 for embedding in HTML/PDF
 * This ensures the image works even when HTML is converted to PDF
 */
function imageToBase64(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const ext = path.extname(imagePath).toLowerCase();

        let mimeType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') {
            mimeType = 'image/jpeg';
        } else if (ext === '.gif') {
            mimeType = 'image/gif';
        } else if (ext === '.svg') {
            mimeType = 'image/svg+xml';
        }

        return `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
        console.error('Error converting image to base64:', error);
        return null;
    }
}

/**
 * Get logo as base64 data URL
 * Returns null if logo not found
 */
function getLogoBase64() {
    // When running in pkg, static assets are in the virtual filesystem
    // We try multiple potential locations
    const possiblePaths = [
        path.join(__dirname, '..', '..', 'public', 'assets', 'logo.png'), // Dev environment
        path.join(process.cwd(), 'public', 'assets', 'logo.png'), // Production adjacent
        path.join(path.dirname(process.execPath), 'public', 'assets', 'logo.png') // Next to EXE
    ];

    // Check if running in pkg
    if (process.pkg) {
        // In pkg, assets defined in package.json are in snapshot
        possiblePaths.unshift(path.join(__dirname, '..', 'templates', 'assets', 'logo.png')); // If bundled specific way
        possiblePaths.unshift(path.join(__dirname, '../../public/assets/logo.png'));
    }

    for (const logoPath of possiblePaths) {
        if (fs.existsSync(logoPath)) {
            return imageToBase64(logoPath);
        }
    }

    console.warn('Logo not found in any checked location');
    return null;
}

/**
 * Get logo HTML img tag ready for templates
 */
function getLogoHTML(width = '100px', alt = 'Restaurant Logo') {
    const logoBase64 = getLogoBase64();

    if (!logoBase64) {
        return '<!-- Logo not found -->';
    }

    return `<img src="${logoBase64}" alt="${alt}" style="width: ${width}; height: auto;" />`;
}

module.exports = {
    imageToBase64,
    getLogoBase64,
    getLogoHTML
};
