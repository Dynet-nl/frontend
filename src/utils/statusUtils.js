// Utility functions for handling status values and display

/**
 * Convert status code to readable text
 * @param {string} statusCode - The status code ('0', '1', '2')
 * @returns {string} - Human readable status text
 */
export const getStatusText = (statusCode) => {
    switch (statusCode) {
        case '2': return 'Completed';
        case '1': return 'In Progress';
        case '0': return 'Not Started';
        default: return 'Unknown';
    }
};

/**
 * Get appropriate CSS class for status
 * @param {string} statusCode - The status code ('0', '1', '2')
 * @returns {string} - CSS class name
 */
export const getStatusClass = (statusCode) => {
    switch (statusCode) {
        case '2': return 'greenCheckmark';
        case '1': return 'orangeCheckmark';
        case '0': return 'redCheckmark';
        default: return 'redCheckmark';
    }
};

/**
 * Get status color for UI elements
 * @param {string} statusCode - The status code ('0', '1', '2')
 * @returns {string} - Hex color code
 */
export const getStatusColor = (statusCode) => {
    switch (statusCode) {
        case '2': return '#4CAF50'; // Green - Completed
        case '1': return '#FF9800'; // Orange - In Progress
        case '0': return '#F44336'; // Red - Not Started
        default: return '#9E9E9E'; // Gray - Unknown
    }
};

/**
 * Check if status indicates completion
 * @param {string} statusCode - The status code
 * @returns {boolean} - True if completed
 */
export const isCompleted = (statusCode) => {
    return statusCode === '2';
};

/**
 * Check if status indicates work in progress
 * @param {string} statusCode - The status code
 * @returns {boolean} - True if in progress
 */
export const isInProgress = (statusCode) => {
    return statusCode === '1';
};
