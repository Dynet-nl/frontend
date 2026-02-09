// Centralized logging utility - only logs in development mode
// Use this instead of console.log/error/warn throughout the app

const isDevelopment = process.env.NODE_ENV !== 'production';

type LogArgs = unknown[];

interface Logger {
    log: (...args: LogArgs) => void;
    error: (...args: LogArgs) => void;
    warn: (...args: LogArgs) => void;
    info: (...args: LogArgs) => void;
    debug: (...args: LogArgs) => void;
    group: (label: string, fn: () => void) => void;
    table: (data: unknown) => void;
}

const logger: Logger = {
    log: (...args: LogArgs): void => {
        if (isDevelopment) {
            console.log('[DEV]', ...args);
        }
    },

    error: (...args: LogArgs): void => {
        if (isDevelopment) {
            console.error('[ERROR]', ...args);
        }
        // In production, you might want to send to error tracking service
        // e.g., Sentry.captureException(args[0]);
    },

    warn: (...args: LogArgs): void => {
        if (isDevelopment) {
            console.warn('[WARN]', ...args);
        }
    },

    info: (...args: LogArgs): void => {
        if (isDevelopment) {
            console.info('[INFO]', ...args);
        }
    },

    debug: (...args: LogArgs): void => {
        if (isDevelopment) {
            console.debug('[DEBUG]', ...args);
        }
    },

    // Group logging for complex debugging
    group: (label: string, fn: () => void): void => {
        if (isDevelopment) {
            console.group(label);
            fn();
            console.groupEnd();
        }
    },

    // Table logging for arrays/objects
    table: (data: unknown): void => {
        if (isDevelopment) {
            console.table(data);
        }
    }
};

export default logger;
