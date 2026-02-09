// User color management utilities for handling user-specific colors in calendar views

import { AxiosInstance } from 'axios';
import axiosPrivate from '../api/axios';
import logger from './logger';

interface User {
    name?: string;
    color?: string;
}

interface CacheInfo {
    hasCache: boolean;
    cacheSize: number;
    cacheAge: number | null;
    users: string[];
}

let userColorsCache: Record<string, string> = {};
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Fetch all user colors from the API and cache them
 */
export const fetchUserColors = async (axiosInstance: AxiosInstance | null = null): Promise<Record<string, string>> => {
    try {
        const now = Date.now();
        if (cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION && Object.keys(userColorsCache).length > 0) {
            logger.log('Using cached user colors');
            return userColorsCache;
        }

        logger.log('Fetching user colors from API');
        const axiosToUse = axiosInstance || axiosPrivate;
        const response = await axiosToUse.get<User[]>('/api/users');
        const users = response.data;

        const colorMap: Record<string, string> = {};
        users.forEach(user => {
            if (user.name && user.color) {
                colorMap[user.name] = user.color;
            }
        });

        userColorsCache = colorMap;
        cacheTimestamp = now;

        logger.log('User colors cached:', colorMap);
        return colorMap;

    } catch (error) {
        logger.error('Error fetching user colors:', error);
        return {};
    }
};

/**
 * Get the color for a specific user
 */
export const getUserColor = (userName: string, defaultColor: string = '#3498db'): string => {
    if (!userName) {
        return defaultColor;
    }

    const color = userColorsCache[userName];
    return color || defaultColor;
};

/**
 * Darken a color by a given percentage
 */
export const darkenColor = (color: string, percent: number): string => {
    const hex = color.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const factor = (100 - percent) / 100;
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);

    const newHex = '#' +
        newR.toString(16).padStart(2, '0') +
        newG.toString(16).padStart(2, '0') +
        newB.toString(16).padStart(2, '0');

    return newHex;
};

/**
 * Clear the user colors cache (useful for testing or when users are updated)
 */
export const clearUserColorsCache = (): void => {
    userColorsCache = {};
    cacheTimestamp = null;
    logger.log('User colors cache cleared');
};

/**
 * Get the current cache status
 */
export const getCacheInfo = (): CacheInfo => {
    return {
        hasCache: Object.keys(userColorsCache).length > 0,
        cacheSize: Object.keys(userColorsCache).length,
        cacheAge: cacheTimestamp ? Date.now() - cacheTimestamp : null,
        users: Object.keys(userColorsCache)
    };
};
