// User color management utilities for handling user-specific colors in calendar views

import axiosPrivate from '../api/axios';

// Cache for storing user colors to avoid repeated API calls
let userColorsCache = {};
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all user colors from the API and cache them
 * @param {Object} axiosInstance - Optional axios instance to use for the request
 * @returns {Promise<Object>} Object mapping user names to their colors
 */
export const fetchUserColors = async (axiosInstance = null) => {
    try {
        // Check if cache is still valid
        const now = Date.now();
        if (cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION && Object.keys(userColorsCache).length > 0) {
            console.log('Using cached user colors');
            return userColorsCache;
        }

        console.log('Fetching user colors from API');
        const axiosToUse = axiosInstance || axiosPrivate;
        const response = await axiosToUse.get('/api/users');
        const users = response.data;
        
        // Create a mapping of user names to colors
        const colorMap = {};
        users.forEach(user => {
            if (user.name && user.color) {
                colorMap[user.name] = user.color;
            }
        });

        // Update cache
        userColorsCache = colorMap;
        cacheTimestamp = now;
        
        console.log('User colors cached:', colorMap);
        return colorMap;
        
    } catch (error) {
        console.error('Error fetching user colors:', error);
        return {};
    }
};

/**
 * Get the color for a specific user
 * @param {string} userName - The name of the user
 * @returns {string} The user's color or default blue
 */
export const getUserColor = (userName) => {
    if (!userName) {
        return '#3498db'; // Default blue
    }
    
    const color = userColorsCache[userName];
    return color || '#3498db'; // Return user color or default blue
};

/**
 * Darken a color by a given percentage
 * @param {string} color - Hex color string (e.g., '#3498db')
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} Darkened color in hex format
 */
export const darkenColor = (color, percent) => {
    // Remove the hash if present
    const hex = color.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate darkened values
    const factor = (100 - percent) / 100;
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);
    
    // Convert back to hex
    const newHex = '#' + 
        newR.toString(16).padStart(2, '0') +
        newG.toString(16).padStart(2, '0') +
        newB.toString(16).padStart(2, '0');
    
    return newHex;
};

/**
 * Clear the user colors cache (useful for testing or when users are updated)
 */
export const clearUserColorsCache = () => {
    userColorsCache = {};
    cacheTimestamp = null;
    console.log('User colors cache cleared');
};

/**
 * Get the current cache status
 * @returns {Object} Cache information
 */
export const getCacheInfo = () => {
    return {
        hasCache: Object.keys(userColorsCache).length > 0,
        cacheSize: Object.keys(userColorsCache).length,
        cacheAge: cacheTimestamp ? Date.now() - cacheTimestamp : null,
        users: Object.keys(userColorsCache)
    };
};
