/**
 * Custom hooks for data fetching with React Query
 * Provides standardized data fetching patterns across the application
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from './useAxiosPrivate';
import logger from '../utils/logger';

/**
 * Query key factory for consistent cache keys
 */
export const queryKeys = {
    // Cities
    cities: ['cities'],
    city: (id) => ['cities', id],
    
    // Areas
    areas: ['areas'],
    areasByCity: (cityId) => ['areas', { cityId }],
    area: (id) => ['areas', id],
    
    // Districts
    districts: ['districts'],
    districtsByArea: (areaId) => ['districts', { areaId }],
    district: (id) => ['districts', id],
    
    // Buildings
    buildings: ['buildings'],
    buildingsByDistrict: (districtId) => ['buildings', { districtId }],
    building: (id) => ['buildings', id],
    
    // Apartments
    apartments: ['apartments'],
    apartmentsByBuilding: (buildingId) => ['apartments', { buildingId }],
    apartment: (id) => ['apartments', id],
    
    // Users
    users: ['users'],
    user: (id) => ['users', id],
    technischeSchouwers: ['users', 'technische-schouwers'],
    hasMonteurs: ['has-monteurs'],
    
    // Dashboard
    dashboard: ['dashboard'],
    dashboardStats: ['dashboard', 'stats'],
};

/**
 * Generic fetch hook with error handling
 * @param {Array} queryKey - React Query cache key
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional query options
 */
export const useFetch = (queryKey, endpoint, options = {}) => {
    const axiosPrivate = useAxiosPrivate();
    
    return useQuery({
        queryKey,
        queryFn: async () => {
            const response = await axiosPrivate.get(endpoint);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
        ...options,
    });
};

/**
 * Hook for fetching all cities
 */
export const useCities = (options = {}) => {
    return useFetch(queryKeys.cities, '/api/cities', options);
};

/**
 * Hook for fetching a single city
 */
export const useCity = (cityId, options = {}) => {
    return useFetch(
        queryKeys.city(cityId),
        `/api/cities/${cityId}`,
        { enabled: !!cityId, ...options }
    );
};

/**
 * Hook for fetching areas by city
 */
export const useAreasByCity = (cityId, options = {}) => {
    return useFetch(
        queryKeys.areasByCity(cityId),
        `/api/areas?cityId=${cityId}`,
        { enabled: !!cityId, ...options }
    );
};

/**
 * Hook for fetching districts by area
 */
export const useDistrictsByArea = (areaId, options = {}) => {
    return useFetch(
        queryKeys.districtsByArea(areaId),
        `/api/districts?areaId=${areaId}`,
        { enabled: !!areaId, ...options }
    );
};

/**
 * Hook for fetching buildings by district
 */
export const useBuildingsByDistrict = (districtId, options = {}) => {
    return useFetch(
        queryKeys.buildingsByDistrict(districtId),
        `/api/buildings?districtId=${districtId}`,
        { enabled: !!districtId, ...options }
    );
};

/**
 * Hook for fetching a single building with apartments
 */
export const useBuilding = (buildingId, options = {}) => {
    return useFetch(
        queryKeys.building(buildingId),
        `/api/buildings/${buildingId}`,
        { enabled: !!buildingId, ...options }
    );
};

/**
 * Hook for fetching apartments by building
 */
export const useApartmentsByBuilding = (buildingId, options = {}) => {
    return useFetch(
        queryKeys.apartmentsByBuilding(buildingId),
        `/api/apartments?buildingId=${buildingId}`,
        { enabled: !!buildingId, ...options }
    );
};

/**
 * Hook for fetching a single apartment
 */
export const useApartment = (apartmentId, options = {}) => {
    return useFetch(
        queryKeys.apartment(apartmentId),
        `/api/apartments/${apartmentId}`,
        { enabled: !!apartmentId, ...options }
    );
};

/**
 * Hook for fetching all users
 */
export const useUsers = (options = {}) => {
    return useFetch(queryKeys.users, '/api/users', options);
};

/**
 * Hook for fetching technische schouwers
 */
export const useTechnischeSchouwers = (options = {}) => {
    const axiosPrivate = useAxiosPrivate();
    
    return useQuery({
        queryKey: queryKeys.technischeSchouwers,
        queryFn: async () => {
            const response = await axiosPrivate.get('/api/users');
            // Filter for technische schouwers
            return response.data.filter(user => 
                user.roles?.TechnischeSchouwer === 8687
            );
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
};

/**
 * Hook for fetching HAS monteurs
 */
export const useHASMonteurs = (options = {}) => {
    const axiosPrivate = useAxiosPrivate();
    
    return useQuery({
        queryKey: queryKeys.hasMonteurs,
        queryFn: async () => {
            const response = await axiosPrivate.get('/api/users');
            // Filter for HAS monteurs
            return response.data.filter(user => 
                user.roles?.HASMonteur === 2023
            );
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
};

/**
 * Hook for fetching dashboard data
 */
export const useDashboard = (options = {}) => {
    return useFetch(queryKeys.dashboard, '/api/dashboard', options);
};

/**
 * Generic mutation hook with cache invalidation
 * @param {Function} mutationFn - Async function to execute
 * @param {Object} options - Mutation options including onSuccess, invalidateKeys
 */
export const useApiMutation = (mutationFn, options = {}) => {
    const queryClient = useQueryClient();
    const { invalidateKeys = [], ...mutationOptions } = options;
    
    return useMutation({
        mutationFn,
        onSuccess: (data, variables, context) => {
            // Invalidate specified cache keys
            invalidateKeys.forEach(key => {
                queryClient.invalidateQueries({ queryKey: key });
            });
            
            if (options.onSuccess) {
                options.onSuccess(data, variables, context);
            }
        },
        onError: (error, variables, context) => {
            logger.error('Mutation error:', error);
            if (options.onError) {
                options.onError(error, variables, context);
            }
        },
        ...mutationOptions,
    });
};

/**
 * Hook for updating an apartment
 */
export const useUpdateApartment = (options = {}) => {
    const axiosPrivate = useAxiosPrivate();
    
    return useApiMutation(
        async ({ apartmentId, data }) => {
            const response = await axiosPrivate.put(`/api/apartments/${apartmentId}`, data);
            return response.data;
        },
        {
            invalidateKeys: [queryKeys.apartments],
            ...options,
        }
    );
};

/**
 * Hook for updating a building
 */
export const useUpdateBuilding = (options = {}) => {
    const axiosPrivate = useAxiosPrivate();
    
    return useApiMutation(
        async ({ buildingId, data }) => {
            const response = await axiosPrivate.put(`/api/buildings/${buildingId}`, data);
            return response.data;
        },
        {
            invalidateKeys: [queryKeys.buildings],
            ...options,
        }
    );
};

/**
 * Hook for creating a city
 */
export const useCreateCity = (options = {}) => {
    const axiosPrivate = useAxiosPrivate();
    
    return useApiMutation(
        async (data) => {
            const response = await axiosPrivate.post('/api/cities', data);
            return response.data;
        },
        {
            invalidateKeys: [queryKeys.cities],
            ...options,
        }
    );
};

/**
 * Hook for deleting a city
 */
export const useDeleteCity = (options = {}) => {
    const axiosPrivate = useAxiosPrivate();
    
    return useApiMutation(
        async (cityId) => {
            const response = await axiosPrivate.delete(`/api/cities/${cityId}`);
            return response.data;
        },
        {
            invalidateKeys: [queryKeys.cities],
            ...options,
        }
    );
};

/**
 * Hook for creating an area
 */
export const useCreateArea = (options = {}) => {
    const axiosPrivate = useAxiosPrivate();
    
    return useApiMutation(
        async (data) => {
            const response = await axiosPrivate.post('/api/areas', data);
            return response.data;
        },
        {
            invalidateKeys: [queryKeys.areas],
            ...options,
        }
    );
};

/**
 * Hook for deleting an area
 */
export const useDeleteArea = (options = {}) => {
    const axiosPrivate = useAxiosPrivate();
    
    return useApiMutation(
        async (areaId) => {
            const response = await axiosPrivate.delete(`/api/areas/${areaId}`);
            return response.data;
        },
        {
            invalidateKeys: [queryKeys.areas],
            ...options,
        }
    );
};

export default {
    queryKeys,
    useFetch,
    useCities,
    useCity,
    useAreasByCity,
    useDistrictsByArea,
    useBuildingsByDistrict,
    useBuilding,
    useApartmentsByBuilding,
    useApartment,
    useUsers,
    useTechnischeSchouwers,
    useHASMonteurs,
    useDashboard,
    useApiMutation,
    useUpdateApartment,
    useUpdateBuilding,
    useCreateCity,
    useDeleteCity,
    useCreateArea,
    useDeleteArea,
};
