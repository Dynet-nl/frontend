// Utility functions for handling status values and display

type StatusCode = '0' | '1' | '2' | string;

/**
 * Convert status code to readable text
 */
export const getStatusText = (statusCode: StatusCode): string => {
    switch (statusCode) {
        case '2': return 'Completed';
        case '1': return 'In Progress';
        case '0': return 'Not Started';
        default: return 'Unknown';
    }
};

/**
 * Get appropriate CSS class for status
 */
export const getStatusClass = (statusCode: StatusCode): string => {
    switch (statusCode) {
        case '2': return 'greenCheckmark';
        case '1': return 'orangeCheckmark';
        case '0': return 'redCheckmark';
        default: return 'redCheckmark';
    }
};

/**
 * Get status color for UI elements
 */
export const getStatusColor = (statusCode: StatusCode): string => {
    switch (statusCode) {
        case '2': return '#4CAF50';
        case '1': return '#FF9800';
        case '0': return '#F44336';
        default: return '#9E9E9E';
    }
};

/**
 * Check if status indicates completion
 */
export const isCompleted = (statusCode: StatusCode): boolean => {
    return statusCode === '2';
};

/**
 * Check if status indicates work in progress
 */
export const isInProgress = (statusCode: StatusCode): boolean => {
    return statusCode === '1';
};
