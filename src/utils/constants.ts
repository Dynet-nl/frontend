// Application constants including role definitions, API endpoints, validation rules, and configuration values.

// Role values must match backend roles_list.js
export const ROLES = {
    ADMIN: 5150,
    TECHNICAL_PLANNING: 1991,
    HAS_PLANNING: 1959,
    TECHNICAL_INSPECTOR: 8687,
    WERKVOORBEREIDER: 1948,
    HAS_MONTEUR: 2023
} as const;

export type RoleKey = keyof typeof ROLES;
export type RoleValue = typeof ROLES[RoleKey];

// Human-readable role names for UI display
export const ROLE_NAMES: Record<RoleValue, string> = {
    [ROLES.ADMIN]: 'Admin',
    [ROLES.TECHNICAL_PLANNING]: 'Technische Planning',
    [ROLES.HAS_PLANNING]: 'HAS Planning',
    [ROLES.TECHNICAL_INSPECTOR]: 'Technische Schouwer',
    [ROLES.WERKVOORBEREIDER]: 'Werkvoorbereider',
    [ROLES.HAS_MONTEUR]: 'HAS Monteur'
};

// Helper to convert role number to display name
export const getRoleName = (roleValue: number): string => ROLE_NAMES[roleValue as RoleValue] || 'Unknown';

export const STATUS_VALUES = {
    PENDING: '0',
    IN_PROGRESS: '1',
    COMPLETED: '2',
    CANCELLED: '3'
} as const;

export type StatusValue = typeof STATUS_VALUES[keyof typeof STATUS_VALUES];

export const API_ENDPOINTS = {
    CITIES: '/api/city',
    AREAS: '/api/area',
    DISTRICTS: '/api/district',
    BUILDINGS: '/api/building',
    APARTMENTS: '/api/apartment',
    USERS: '/api/users',
    DASHBOARD: '/api/dashboard'
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];

export const CACHE_KEYS = {
    CITIES: 'cities',
    AREAS: 'areas',
    DISTRICTS: 'districts',
    DASHBOARD_STATS: 'dashboard_stats'
} as const;

export type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];

export const VALIDATION_RULES = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[+]?[1-9][\d]{0,15}$/
} as const;

export const UI_CONFIG = {
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000,
    LOADING_TIMEOUT: 30000,
    AUTO_SAVE_INTERVAL: 5000,
    // Login page timing
    LOGIN_VALIDATION_DELAY: 300,
    LOGIN_PROFILE_DELAY: 200,
    LOGIN_REDIRECT_DELAY: 500,
    TIMER_INTERVAL: 100,
    // Animation durations
    TRANSITION_DURATION: 300,
    SPINNER_SPEED: 800,
    PULSE_DURATION: 1500
} as const;

export const FILE_CONSTRAINTS = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ] as const,
    ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv'] as const
} as const;

export type AllowedFileType = typeof FILE_CONSTRAINTS.ALLOWED_TYPES[number];
export type AllowedFileExtension = typeof FILE_CONSTRAINTS.ALLOWED_EXTENSIONS[number];
