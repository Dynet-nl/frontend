/**
 * API Service Layer
 *
 * Centralized API calls with consistent error handling and response typing.
 * Use with the useApiQuery hooks for React Query integration.
 */

import axios from '../api/axios';
import logger from '../utils/logger';
import { sanitize } from '../utils/helpers';
import { AxiosRequestConfig, Method } from 'axios';

// Types
interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

interface City {
    _id: string;
    name: string;
}

interface Area {
    _id: string;
    name: string;
    city: string;
}

interface District {
    _id: string;
    name: string;
    area: string;
}

interface Building {
    _id: string;
    name: string;
    address: string;
    district: string;
}

interface Apartment {
    _id: string;
    address: string;
    building: string;
}

interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles?: {
        Admin?: number;
        TechnischeSchouwer?: number;
        TechnischePlanning?: number;
        Werkvoorbereider?: number;
        HASPlanning?: number;
        HASMonteur?: number;
    };
}

interface DashboardStats {
    totalBuildings: number;
    totalApartments: number;
    completedApartments: number;
    pendingApartments: number;
}

interface AuthCredentials {
    email: string;
    password: string;
}

interface AuthResponse {
    // Note: accessToken is now stored in httpOnly cookie by the backend
    roles: number[];
}

type SanitizableData = Record<string, unknown> | null;

/**
 * Generic API request handler with error handling and input sanitization
 */
const apiRequest = async <T>(
    method: Method,
    url: string,
    data: SanitizableData | FormData = null,
    config: AxiosRequestConfig = {}
): Promise<ApiResponse<T>> => {
    try {
        // Sanitize input data before sending to API (skip for FormData)
        const sanitizedData = data instanceof FormData ? data : sanitize.forApi(data);

        const response = await axios({
            method,
            url,
            data: sanitizedData,
            ...config,
        });
        return { data: response.data as T, error: null };
    } catch (error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        const errorMessage = axiosError.response?.data?.message || axiosError.message || 'An error occurred';
        logger.error(`API ${method.toUpperCase()} ${url} failed:`, errorMessage);
        return { data: null, error: errorMessage };
    }
};

/**
 * Cities API
 */
export const citiesApi = {
    getAll: () => apiRequest<City[]>('get', '/api/cities'),
    getById: (id: string) => apiRequest<City>('get', `/api/cities/${id}`),
    create: (data: Partial<City>) => apiRequest<City>('post', '/api/cities', data as SanitizableData),
    update: (id: string, data: Partial<City>) => apiRequest<City>('put', `/api/cities/${id}`, data as SanitizableData),
    delete: (id: string) => apiRequest<void>('delete', `/api/cities/${id}`),
};

/**
 * Areas API
 */
export const areasApi = {
    getAll: () => apiRequest<Area[]>('get', '/api/areas'),
    getByCity: (cityId: string) => apiRequest<Area[]>('get', `/api/areas?cityId=${cityId}`),
    getById: (id: string) => apiRequest<Area>('get', `/api/areas/${id}`),
    create: (data: Partial<Area>) => apiRequest<Area>('post', '/api/areas', data as SanitizableData),
    update: (id: string, data: Partial<Area>) => apiRequest<Area>('put', `/api/areas/${id}`, data as SanitizableData),
    delete: (id: string) => apiRequest<void>('delete', `/api/areas/${id}`),
};

/**
 * Districts API
 */
export const districtsApi = {
    getAll: () => apiRequest<District[]>('get', '/api/districts'),
    getByArea: (areaId: string) => apiRequest<District[]>('get', `/api/districts?areaId=${areaId}`),
    getById: (id: string) => apiRequest<District>('get', `/api/districts/${id}`),
    create: (data: Partial<District>) => apiRequest<District>('post', '/api/districts', data as SanitizableData),
    update: (id: string, data: Partial<District>) =>
        apiRequest<District>('put', `/api/districts/${id}`, data as SanitizableData),
    delete: (id: string) => apiRequest<void>('delete', `/api/districts/${id}`),
    import: (areaId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest<District>('post', `/api/districts/import/${areaId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

/**
 * Buildings API
 */
export const buildingsApi = {
    getAll: () => apiRequest<Building[]>('get', '/api/buildings'),
    getByDistrict: (districtId: string) => apiRequest<Building[]>('get', `/api/buildings?districtId=${districtId}`),
    getById: (id: string) => apiRequest<Building>('get', `/api/buildings/${id}`),
    create: (data: Partial<Building>) => apiRequest<Building>('post', '/api/buildings', data as SanitizableData),
    update: (id: string, data: Partial<Building>) =>
        apiRequest<Building>('put', `/api/buildings/${id}`, data as SanitizableData),
    delete: (id: string) => apiRequest<void>('delete', `/api/buildings/${id}`),
    block: (id: string) => apiRequest<Building>('put', `/api/buildings/${id}/block`),
    unblock: (id: string) => apiRequest<Building>('put', `/api/buildings/${id}/unblock`),
};

/**
 * Apartments API
 */
export const apartmentsApi = {
    getAll: () => apiRequest<Apartment[]>('get', '/api/apartments'),
    getByBuilding: (buildingId: string) => apiRequest<Apartment[]>('get', `/api/apartments?buildingId=${buildingId}`),
    getById: (id: string) => apiRequest<Apartment>('get', `/api/apartments/${id}`),
    create: (data: Partial<Apartment>) => apiRequest<Apartment>('post', '/api/apartments', data as SanitizableData),
    update: (id: string, data: Partial<Apartment>) =>
        apiRequest<Apartment>('put', `/api/apartments/${id}`, data as SanitizableData),
    delete: (id: string) => apiRequest<void>('delete', `/api/apartments/${id}`),

    // HAS Planning
    updateHASMonteur: (id: string, data: Record<string, unknown>) =>
        apiRequest<Apartment>('put', `/api/apartment/${id}/has-monteur`, data),

    // Technical Planning
    updateTechnischePlanning: (id: string, data: Record<string, unknown>) =>
        apiRequest<Apartment>('put', `/api/apartment/${id}/technische-planning`, data),
};

/**
 * Users API
 */
export const usersApi = {
    getAll: () => apiRequest<User[]>('get', '/api/users'),
    getById: (id: string) => apiRequest<User>('get', `/api/users/${id}`),
    create: (data: Partial<User>) => apiRequest<User>('post', '/api/users', data as SanitizableData),
    update: (id: string, data: Partial<User>) => apiRequest<User>('put', `/api/users/${id}`, data as SanitizableData),
    delete: (id: string) => apiRequest<void>('delete', `/api/users/${id}`),

    // Role-specific queries
    getTechnischeSchouwers: async (): Promise<ApiResponse<User[]>> => {
        const result = await apiRequest<User[]>('get', '/api/users');
        if (result.data) {
            result.data = result.data.filter((user) => user.roles?.TechnischeSchouwer === 8687);
        }
        return result;
    },
    getHASMonteurs: async (): Promise<ApiResponse<User[]>> => {
        const result = await apiRequest<User[]>('get', '/api/users');
        if (result.data) {
            result.data = result.data.filter((user) => user.roles?.HASMonteur === 2023);
        }
        return result;
    },
};

/**
 * Dashboard API
 */
export const dashboardApi = {
    getStats: () => apiRequest<DashboardStats>('get', '/api/dashboard'),
    getOverview: () => apiRequest<DashboardStats>('get', '/api/dashboard/overview'),
};

/**
 * Auth API
 */
export const authApi = {
    login: (credentials: AuthCredentials) => apiRequest<AuthResponse>('post', '/api/auth', credentials),
    logout: () => apiRequest<void>('post', '/api/logout'),
    refresh: () => apiRequest<{ accessToken: string }>('get', '/api/refresh'),
};

/**
 * Schedule API
 */
export const scheduleApi = {
    getByDateRange: (startDate: string, endDate: string, type: string) =>
        apiRequest<unknown[]>('get', `/api/schedule?startDate=${startDate}&endDate=${endDate}&type=${type}`),
    getByPersonnel: (personnelId: string, type: string) =>
        apiRequest<unknown[]>('get', `/api/schedule/personnel/${personnelId}?type=${type}`),
    getByWeek: (weekNumber: number, year: number, type: string) =>
        apiRequest<unknown[]>('get', `/api/schedule/week/${weekNumber}?year=${year}&type=${type}`),
};

// Export all APIs as a single object for convenience
const api = {
    cities: citiesApi,
    areas: areasApi,
    districts: districtsApi,
    buildings: buildingsApi,
    apartments: apartmentsApi,
    users: usersApi,
    dashboard: dashboardApi,
    auth: authApi,
    schedule: scheduleApi,
};

export default api;
