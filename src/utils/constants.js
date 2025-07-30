// Application constants including role definitions, API endpoints, validation rules, and configuration values.

export const ROLES = {
    ADMIN: 5150,
    TECHNICAL_PLANNING: 1991,
    HAS_PLANNING: 1959,
    TECHNICAL_INSPECTOR: 8687,
    WERKVOORBEREIDER: 1948,
    HAS_MONTEUR: 2023
};
export const STATUS_VALUES = {
    PENDING: '0',
    IN_PROGRESS: '1', 
    COMPLETED: '2',
    CANCELLED: '3'
};
export const API_ENDPOINTS = {
    CITIES: '/api/city',
    AREAS: '/api/area',
    DISTRICTS: '/api/district',
    BUILDINGS: '/api/building',
    APARTMENTS: '/api/apartment',
    USERS: '/api/users',
    DASHBOARD: '/api/dashboard'
};
export const CACHE_KEYS = {
    CITIES: 'cities',
    AREAS: 'areas',
    DISTRICTS: 'districts',
    DASHBOARD_STATS: 'dashboard_stats'
};
export const VALIDATION_RULES = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/
};
export const UI_CONFIG = {
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000,
    LOADING_TIMEOUT: 30000,
    AUTO_SAVE_INTERVAL: 5000
};
export const FILE_CONSTRAINTS = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ],
    ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv']
};
