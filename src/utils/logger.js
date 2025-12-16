// Centralized logging utility - only logs in development mode
// Use this instead of console.log/error/warn throughout the app

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log('[DEV]', ...args);
        }
    },
    
    error: (...args) => {
        if (isDevelopment) {
            console.error('[ERROR]', ...args);
        }
        // In production, you might want to send to error tracking service
        // e.g., Sentry.captureException(args[0]);
    },
    
    warn: (...args) => {
        if (isDevelopment) {
            console.warn('[WARN]', ...args);
        }
    },
    
    info: (...args) => {
        if (isDevelopment) {
            console.info('[INFO]', ...args);
        }
    },
    
    debug: (...args) => {
        if (isDevelopment) {
            console.debug('[DEBUG]', ...args);
        }
    },
    
    // Group logging for complex debugging
    group: (label, fn) => {
        if (isDevelopment) {
            console.group(label);
            fn();
            console.groupEnd();
        }
    },
    
    // Table logging for arrays/objects
    table: (data) => {
        if (isDevelopment) {
            console.table(data);
        }
    }
};

export default logger;
