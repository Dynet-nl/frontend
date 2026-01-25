/**
 * API Service Layer
 * 
 * Centralized API calls with consistent error handling and response typing.
 * Use with the useApiQuery hooks for React Query integration.
 */

import axios from '../api/axios';
import logger from '../utils/logger';

/**
 * Generic API request handler with error handling
 */
const apiRequest = async (method, url, data = null, config = {}) => {
    try {
        const response = await axios({
            method,
            url,
            data,
            ...config,
        });
        return { data: response.data, error: null };
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        logger.error(`API ${method.toUpperCase()} ${url} failed:`, errorMessage);
        return { data: null, error: errorMessage };
    }
};

/**
 * Cities API
 */
export const citiesApi = {
    getAll: () => apiRequest('get', '/api/cities'),
    getById: (id) => apiRequest('get', `/api/cities/${id}`),
    create: (data) => apiRequest('post', '/api/cities', data),
    update: (id, data) => apiRequest('put', `/api/cities/${id}`, data),
    delete: (id) => apiRequest('delete', `/api/cities/${id}`),
};

/**
 * Areas API
 */
export const areasApi = {
    getAll: () => apiRequest('get', '/api/areas'),
    getByCity: (cityId) => apiRequest('get', `/api/areas?cityId=${cityId}`),
    getById: (id) => apiRequest('get', `/api/areas/${id}`),
    create: (data) => apiRequest('post', '/api/areas', data),
    update: (id, data) => apiRequest('put', `/api/areas/${id}`, data),
    delete: (id) => apiRequest('delete', `/api/areas/${id}`),
};

/**
 * Districts API
 */
export const districtsApi = {
    getAll: () => apiRequest('get', '/api/districts'),
    getByArea: (areaId) => apiRequest('get', `/api/districts?areaId=${areaId}`),
    getById: (id) => apiRequest('get', `/api/districts/${id}`),
    create: (data) => apiRequest('post', '/api/districts', data),
    update: (id, data) => apiRequest('put', `/api/districts/${id}`, data),
    delete: (id) => apiRequest('delete', `/api/districts/${id}`),
    import: (areaId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest('post', `/api/districts/import/${areaId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

/**
 * Buildings API
 */
export const buildingsApi = {
    getAll: () => apiRequest('get', '/api/buildings'),
    getByDistrict: (districtId) => apiRequest('get', `/api/buildings?districtId=${districtId}`),
    getById: (id) => apiRequest('get', `/api/buildings/${id}`),
    create: (data) => apiRequest('post', '/api/buildings', data),
    update: (id, data) => apiRequest('put', `/api/buildings/${id}`, data),
    delete: (id) => apiRequest('delete', `/api/buildings/${id}`),
    block: (id) => apiRequest('put', `/api/buildings/${id}/block`),
    unblock: (id) => apiRequest('put', `/api/buildings/${id}/unblock`),
};

/**
 * Apartments API
 */
export const apartmentsApi = {
    getAll: () => apiRequest('get', '/api/apartments'),
    getByBuilding: (buildingId) => apiRequest('get', `/api/apartments?buildingId=${buildingId}`),
    getById: (id) => apiRequest('get', `/api/apartments/${id}`),
    create: (data) => apiRequest('post', '/api/apartments', data),
    update: (id, data) => apiRequest('put', `/api/apartments/${id}`, data),
    delete: (id) => apiRequest('delete', `/api/apartments/${id}`),
    
    // HAS Planning
    updateHASMonteur: (id, data) => apiRequest('put', `/api/apartment/${id}/has-monteur`, data),
    
    // Technical Planning
    updateTechnischePlanning: (id, data) => apiRequest('put', `/api/apartment/${id}/technische-planning`, data),
};

/**
 * Users API
 */
export const usersApi = {
    getAll: () => apiRequest('get', '/api/users'),
    getById: (id) => apiRequest('get', `/api/users/${id}`),
    create: (data) => apiRequest('post', '/api/users', data),
    update: (id, data) => apiRequest('put', `/api/users/${id}`, data),
    delete: (id) => apiRequest('delete', `/api/users/${id}`),
    
    // Role-specific queries
    getTechnischeSchouwers: async () => {
        const result = await apiRequest('get', '/api/users');
        if (result.data) {
            result.data = result.data.filter(user => user.roles?.TechnischeSchouwer === 8687);
        }
        return result;
    },
    getHASMonteurs: async () => {
        const result = await apiRequest('get', '/api/users');
        if (result.data) {
            result.data = result.data.filter(user => user.roles?.HASMonteur === 2023);
        }
        return result;
    },
};

/**
 * Dashboard API
 */
export const dashboardApi = {
    getStats: () => apiRequest('get', '/api/dashboard'),
    getOverview: () => apiRequest('get', '/api/dashboard/overview'),
};

/**
 * Auth API
 */
export const authApi = {
    login: (credentials) => apiRequest('post', '/api/auth', credentials),
    logout: () => apiRequest('post', '/api/logout'),
    refresh: () => apiRequest('get', '/api/refresh'),
};

/**
 * Schedule API
 */
export const scheduleApi = {
    getByDateRange: (startDate, endDate, type) => 
        apiRequest('get', `/api/schedule?startDate=${startDate}&endDate=${endDate}&type=${type}`),
    getByPersonnel: (personnelId, type) =>
        apiRequest('get', `/api/schedule/personnel/${personnelId}?type=${type}`),
    getByWeek: (weekNumber, year, type) =>
        apiRequest('get', `/api/schedule/week/${weekNumber}?year=${year}&type=${type}`),
};

// Export all APIs as a single object for convenience
export default {
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
