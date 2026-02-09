// Utility functions including validation helpers, formatting functions, and common operations.

import { VALIDATION_RULES, UI_CONFIG } from './constants';
import logger from './logger';

// ============ Types ============

type DebouncedFunction<T extends unknown[]> = (...args: T) => void;

interface AxiosError {
    response?: {
        data?: {
            message?: string;
        };
        status?: number;
    };
    request?: unknown;
    message?: string;
}

type SanitizableValue = string | number | boolean | null | undefined | object | unknown[];

// ============ Debounce ============

export const debounce = <T extends unknown[]>(
    func: (...args: T) => void,
    delay: number = UI_CONFIG.DEBOUNCE_DELAY
): DebouncedFunction<T> => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: T): void => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

// ============ Validators ============

export const validators = {
    name: (value: string | null | undefined): string | null => {
        if (!value || value.trim().length < VALIDATION_RULES.NAME_MIN_LENGTH) {
            return 'Name must be at least 2 characters long';
        }
        if (value.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
            return 'Name must be less than 100 characters';
        }
        return null;
    },

    email: (value: string | null | undefined): string | null => {
        if (!value) return 'Email is required';
        if (!VALIDATION_RULES.EMAIL_REGEX.test(value)) {
            return 'Please enter a valid email address';
        }
        return null;
    },

    required: (value: unknown, fieldName: string = 'This field'): string | null => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return `${fieldName} is required`;
        }
        return null;
    }
};

// ============ Formatters ============

export const formatters = {
    currency: (amount: number, currency: string = 'EUR'): string => {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    date: (date: string | Date, options: Intl.DateTimeFormatOptions = {}): string => {
        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        };
        return new Intl.DateTimeFormat('nl-NL', defaultOptions).format(new Date(date));
    },

    percentage: (value: number, decimals: number = 1): string => {
        return `${Number(value).toFixed(decimals)}%`;
    },

    fileSize: (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// ============ Array Utils ============

export const arrayUtils = {
    groupBy: <T extends Record<string, unknown>>(array: T[], key: keyof T): Record<string, T[]> => {
        return array.reduce((groups: Record<string, T[]>, item: T) => {
            const groupKey = String(item[key]);
            const group = (groups[groupKey] = groups[groupKey] || []);
            group.push(item);
            return groups;
        }, {});
    },

    sortBy: <T extends Record<string, unknown>>(
        array: T[],
        key: keyof T,
        direction: 'asc' | 'desc' = 'asc'
    ): T[] => {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (direction === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            }
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        });
    },

    unique: <T>(array: T[], key?: keyof T): T[] => {
        if (key) {
            const seen = new Set<unknown>();
            return array.filter(item => {
                const value = (item as Record<string, unknown>)[key as string];
                if (seen.has(value)) return false;
                seen.add(value);
                return true;
            });
        }
        return [...new Set(array)];
    }
};

// ============ Error Handlers ============

export const errorHandlers = {
    getErrorMessage: (error: AxiosError): string => {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.message) {
            return error.message;
        }
        return 'An unexpected error occurred';
    },

    isNetworkError: (error: AxiosError): boolean => {
        return !error.response && !!error.request;
    },

    isAuthError: (error: AxiosError): boolean => {
        return error.response?.status === 401;
    }
};

// ============ Storage ============

export const storage = {
    get: <T>(key: string, defaultValue: T | null = null): T | null => {
        try {
            const item = localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : defaultValue;
        } catch (error) {
            logger.warn(`Error reading from localStorage key "${key}":`, error);
            return defaultValue;
        }
    },

    set: <T>(key: string, value: T): boolean => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.warn(`Error writing to localStorage key "${key}":`, error);
            return false;
        }
    },

    remove: (key: string): boolean => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            logger.warn(`Error removing localStorage key "${key}":`, error);
            return false;
        }
    }
};

// ============ DOM Utils ============

export const domUtils = {
    scrollToTop: (behavior: ScrollBehavior = 'smooth'): void => {
        window.scrollTo({ top: 0, behavior });
    },

    scrollToElement: (element: HTMLElement | null, offset: number = 0): void => {
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({ top: elementPosition, behavior: 'smooth' });
        }
    },

    copyToClipboard: async (text: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            logger.warn('Failed to copy to clipboard:', error);
            return false;
        }
    }
};

// ============ Input Sanitization ============

export const sanitize = {
    // Remove HTML tags and dangerous characters from strings
    string: (input: unknown): unknown => {
        if (typeof input !== 'string') return input;
        return input
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/[<>]/g, '') // Remove angle brackets
            .trim();
    },

    // Sanitize an object's string values recursively
    object: <T extends SanitizableValue>(obj: T): T => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'string') return sanitize.string(obj) as T;
        if (Array.isArray(obj)) {
            return obj.map(item => sanitize.object(item)) as T;
        }
        if (typeof obj === 'object') {
            const sanitized: Record<string, unknown> = {};
            for (const key of Object.keys(obj as object)) {
                sanitized[key] = sanitize.object((obj as Record<string, unknown>)[key] as SanitizableValue);
            }
            return sanitized as T;
        }
        return obj;
    },

    // Escape HTML entities for safe display
    escapeHtml: (str: unknown): unknown => {
        if (typeof str !== 'string') return str;
        const htmlEscapes: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        return str.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
    },

    // Sanitize data before sending to API
    forApi: <T extends SanitizableValue>(data: T): T => {
        return sanitize.object(data);
    }
};
