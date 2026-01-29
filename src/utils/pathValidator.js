const path = require('path');

/**
 * Path validation utilities
 * Checks for common path issues (spaces, special characters, etc.)
 */

/**
 * Check if path contains spaces
 */
function hasSpaces(filePath) {
    return filePath.includes(' ');
}

/**
 * Check if path is in a problematic location
 */
function isProblematicPath(filePath) {
    const problematicPaths = [
        'Desktop',
        'OneDrive',
        'Documents',
        'AppData\\Roaming'
    ];

    return problematicPaths.some(bad => filePath.includes(bad));
}

/**
 * Validate project path
 */
function validateProjectPath(projectRoot) {
    const issues = [];

    if (hasSpaces(projectRoot)) {
        issues.push({
            severity: 'warning',
            message: 'Project path contains spaces - this may cause issues with some tools'
        });
    }

    if (isProblematicPath(projectRoot)) {
        issues.push({
            severity: 'warning',
            message: 'Project is in a user-specific location (Desktop/OneDrive) - consider moving to C:\\kiosk\\'
        });
    }

    return {
        valid: issues.length === 0,
        issues,
        path: projectRoot
    };
}

module.exports = {
    hasSpaces,
    isProblematicPath,
    validateProjectPath
};
