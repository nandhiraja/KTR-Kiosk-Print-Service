const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * System validation utilities
 * Checks for Chrome, SumatraPDF, Node.js availability
 */

// Common Chrome installation paths on Windows
const CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe')
];

// SumatraPDF paths (for silent printing)
const SUMATRA_PATHS = [
    'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe',
    'C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe',
    path.join(process.env.LOCALAPPDATA || '', 'SumatraPDF\\SumatraPDF.exe')
];

/**
 * Check if Chrome is installed
 */
function hasChrome() {
    return getChromePath() !== null;
}

/**
 * Get Chrome executable path
 */
function getChromePath() {
    // Check environment variable first
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
        return process.env.CHROME_PATH;
    }

    // Check common installation paths
    for (const chromePath of CHROME_PATHS) {
        if (fs.existsSync(chromePath)) {
            return chromePath;
        }
    }

    // Try to find via registry (Windows only)
    if (process.platform === 'win32') {
        try {
            const regPath = execSync(
                'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve',
                { encoding: 'utf8' }
            );
            const match = regPath.match(/REG_SZ\s+(.+)/);
            if (match && match[1] && fs.existsSync(match[1])) {
                return match[1].trim();
            }
        } catch (err) {
            // Registry query failed, continue
        }
    }

    return null;
}

/**
 * Check if SumatraPDF is installed
 */
function hasSumatraPDF() {
    return getSumatraPath() !== null;
}

/**
 * Get SumatraPDF executable path
 */
function getSumatraPath() {
    for (const sumatraPath of SUMATRA_PATHS) {
        if (fs.existsSync(sumatraPath)) {
            return sumatraPath;
        }
    }
    return null;
}

/**
 * Check if Node.js is available
 */
function hasNodeJS() {
    try {
        const version = process.version;
        return version && version.startsWith('v');
    } catch (err) {
        return false;
    }
}

/**
 * Get Node.js version
 */
function getNodeVersion() {
    return process.version || 'unknown';
}

/**
 * Validate all prerequisites
 */
function validateSystem() {
    const results = {
        chrome: hasChrome(),
        chromePath: getChromePath(),
        sumatra: hasSumatraPDF(),
        sumatraPath: getSumatraPath(),
        node: hasNodeJS(),
        nodeVersion: getNodeVersion(),
        platform: process.platform,
        arch: process.arch
    };

    return results;
}

/**
 * Get validation summary for logging
 */
function getValidationSummary() {
    const validation = validateSystem();

    return {
        hasChrome: validation.chrome,
        chromePath: validation.chromePath || 'NOT FOUND',
        hasSumatraPDF: validation.sumatra,
        sumatraPath: validation.sumatraPath || 'NOT FOUND',
        nodeVersion: validation.nodeVersion,
        platform: `${validation.platform} ${validation.arch}`
    };
}

module.exports = {
    hasChrome,
    getChromePath,
    hasSumatraPDF,
    getSumatraPath,
    hasNodeJS,
    getNodeVersion,
    validateSystem,
    getValidationSummary
};
