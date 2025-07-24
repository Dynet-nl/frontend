// Enhanced utility functions for better code reusability and performance
import { VALIDATION_RULES, UI_CONFIG } from './constants';

/**
 * Debounced function wrapper for performance optimization
 */
export const debounce = (func, delay = UI_CONFIG.DEBOUNCE_DELAY) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

/**
 * Validation utilities
 */
export const validators = {
    name: (value) => {
        if (!value || value.trim().length < VALIDATION_RULES.NAME_MIN_LENGTH) {
            return 'Name must be at least 2 characters long';
        }
        if (value.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
            return 'Name must be less than 100 characters';
        }
        return null;
    },
    
    email: (value) => {
        if (!value) return 'Email is required';
        if (!VALIDATION_RULES.EMAIL_REGEX.test(value)) {
            return 'Please enter a valid email address';
        }
        return null;
    },
    
    required: (value, fieldName = 'This field') => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return `${fieldName} is required`;
        }
        return null;
    }
};

/**
 * Format utilities
 */
export const formatters = {
    currency: (amount, currency = 'EUR') => {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    date: (date, options = {}) => {
        const defaultOptions = {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            ...options
        };
        return new Intl.DateTimeFormat('nl-NL', defaultOptions).format(new Date(date));
    },
    
    percentage: (value, decimals = 1) => {
        return `${Number(value).toFixed(decimals)}%`;
    },
    
    fileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

/**
 * Array utilities for better performance
 */
export const arrayUtils = {
    groupBy: (array, key) => {
        return array.reduce((groups, item) => {
            const group = (groups[item[key]] = groups[item[key]] || []);
            group.push(item);
            return groups;
        }, {});
    },
    
    sortBy: (array, key, direction = 'asc') => {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (direction === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            }
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        });
    },
    
    unique: (array, key) => {
        if (key) {
            const seen = new Set();
            return array.filter(item => {
                const value = item[key];
                if (seen.has(value)) return false;
                seen.add(value);
                return true;
            });
        }
        return [...new Set(array)];
    }
};

/**
 * Error handling utilities
 */
export const errorHandlers = {
    getErrorMessage: (error) => {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.message) {
            return error.message;
        }
        return 'An unexpected error occurred';
    },
    
    isNetworkError: (error) => {
        return !error.response && error.request;
    },
    
    isAuthError: (error) => {
        return error.response?.status === 401;
    }
};

/**
 * Local storage utilities with error handling
 */
export const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading from localStorage key "${key}":`, error);
            return defaultValue;
        }
    },
    
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Error writing to localStorage key "${key}":`, error);
            return false;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
            return false;
        }
    }
};

/**
 * DOM utilities
 */
export const domUtils = {
    scrollToTop: (behavior = 'smooth') => {
        window.scrollTo({ top: 0, behavior });
    },
    
    scrollToElement: (element, offset = 0) => {
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({ top: elementPosition, behavior: 'smooth' });
        }
    },
    
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.warn('Failed to copy to clipboard:', error);
            return false;
        }
    }
};
