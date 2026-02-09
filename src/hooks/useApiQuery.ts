/**
 * Custom hooks for data fetching with React Query
 * Provides standardized data fetching patterns across the application
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions, QueryKey } from '@tanstack/react-query';
import { AxiosInstance } from 'axios';
import useAxiosPrivate from './useAxiosPrivate';
import logger from '../utils/logger';

// Types
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

/**
 * Query key factory for consistent cache keys
 */
export const queryKeys = {
    // Cities
    cities: ['cities'] as const,
    city: (id: string) => ['cities', id] as const,

    // Areas
    areas: ['areas'] as const,
    areasByCity: (cityId: string) => ['areas', { cityId }] as const,
    area: (id: string) => ['areas', id] as const,

    // Districts
    districts: ['districts'] as const,
    districtsByArea: (areaId: string) => ['districts', { areaId }] as const,
    district: (id: string) => ['districts', id] as const,

    // Buildings
    buildings: ['buildings'] as const,
    buildingsByDistrict: (districtId: string) => ['buildings', { districtId }] as const,
    building: (id: string) => ['buildings', id] as const,

    // Apartments
    apartments: ['apartments'] as const,
    apartmentsByBuilding: (buildingId: string) => ['apartments', { buildingId }] as const,
    apartment: (id: string) => ['apartments', id] as const,

    // Users
    users: ['users'] as const,
    user: (id: string) => ['users', id] as const,
    technischeSchouwers: ['users', 'technische-schouwers'] as const,
    hasMonteurs: ['has-monteurs'] as const,

    // Dashboard
    dashboard: ['dashboard'] as const,
    dashboardStats: ['dashboard', 'stats'] as const,
};

/**
 * Generic fetch hook with error handling
 */
export const useFetch = <T>(
    queryKey: QueryKey,
    endpoint: string,
    options: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> = {}
) => {
    const axiosPrivate = useAxiosPrivate();

    return useQuery<T, Error>({
        queryKey,
        queryFn: async () => {
            const response = await axiosPrivate.get<T>(endpoint);
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
export const useCities = (options: Omit<UseQueryOptions<City[], Error>, 'queryKey' | 'queryFn'> = {}) => {
    return useFetch<City[]>(queryKeys.cities, '/api/cities', options);
};

/**
 * Hook for fetching a single city
 */
export const useCity = (cityId: string, options: Omit<UseQueryOptions<City, Error>, 'queryKey' | 'queryFn'> = {}) => {
    return useFetch<City>(queryKeys.city(cityId), `/api/cities/${cityId}`, { enabled: !!cityId, ...options });
};

/**
 * Hook for fetching areas by city
 */
export const useAreasByCity = (cityId: string, options: Omit<UseQueryOptions<Area[], Error>, 'queryKey' | 'queryFn'> = {}) => {
    return useFetch<Area[]>(queryKeys.areasByCity(cityId), `/api/areas?cityId=${cityId}`, { enabled: !!cityId, ...options });
};

/**
 * Hook for fetching districts by area
 */
export const useDistrictsByArea = (areaId: string, options: Omit<UseQueryOptions<District[], Error>, 'queryKey' | 'queryFn'> = {}) => {
    return useFetch<District[]>(queryKeys.districtsByArea(areaId), `/api/districts?areaId=${areaId}`, { enabled: !!areaId, ...options });
};

/**
 * Hook for fetching buildings by district
 */
export const useBuildingsByDistrict = (districtId: string, options: Omit<UseQueryOptions<Building[], Error>, 'queryKey' | 'queryFn'> = {}) => {
    return useFetch<Building[]>(queryKeys.buildingsByDistrict(districtId), `/api/buildings?districtId=${districtId}`, {
        enabled: !!districtId,
        ...options,
    });
};

/**
 * Hook for fetching a single building with apartments
 */
export const useBuilding = (buildingId: string, options: Omit<UseQueryOptions<Building, Error>, 'queryKey' | 'queryFn'> = {}) => {
    return useFetch<Building>(queryKeys.building(buildingId), `/api/buildings/${buildingId}`, {
        enabled: !!buildingId,
        ...options,
    });
};

/**
 * Hook for fetching apartments by building
 */
export const useApartmentsByBuilding = (buildingId: string, options: Omit<UseQueryOptions<Apartment[], Error>, 'queryKey' | 'queryFn'> = {}) => {
    return useFetch<Apartment[]>(queryKeys.apartmentsByBuilding(buildingId), `/api/apartments?buildingId=${buildingId}`, {
        enabled: !!buildingId,
        ...options,
    });
};

/**
 * Hook for fetching a single apartment
 */
export const useApartment = (apartmentId: string, options: Omit<UseQueryOptions<Apartment, Error>, 'queryKey' | 'queryFn'> = {}) => {
    return useFetch<Apartment>(queryKeys.apartment(apartmentId), `/api/apartments/${apartmentId}`, {
        enabled: !!apartmentId,
        ...options,
    });
};

/**
 * Hook for fetching all users
 */
export const useUsers = (options: Omit<UseQueryOptions<User[], Error>, 'queryKey' | 'queryFn'> = {}) => {
    return useFetch<User[]>(queryKeys.users, '/api/users', options);
};

/**
 * Hook for fetching technische schouwers
 */
export const useTechnischeSchouwers = (options: Omit<UseQueryOptions<User[], Error>, 'queryKey' | 'queryFn'> = {}) => {
    const axiosPrivate = useAxiosPrivate();

    return useQuery<User[], Error>({
        queryKey: queryKeys.technischeSchouwers,
        queryFn: async () => {
            const response = await axiosPrivate.get<{ data: User[]; pagination?: unknown } | User[]>('/api/users');
            // Handle both paginated response { data: [...] } and legacy array response
            const users = Array.isArray(response.data) ? response.data : response.data.data;
            return users.filter((user) => user.roles?.TechnischeSchouwer === 8687);
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
};

/**
 * Hook for fetching HAS monteurs
 */
export const useHASMonteurs = (options: Omit<UseQueryOptions<User[], Error>, 'queryKey' | 'queryFn'> = {}) => {
    const axiosPrivate = useAxiosPrivate();

    return useQuery<User[], Error>({
        queryKey: queryKeys.hasMonteurs,
        queryFn: async () => {
            const response = await axiosPrivate.get<{ data: User[]; pagination?: unknown } | User[]>('/api/users');
            // Handle both paginated response { data: [...] } and legacy array response
            const users = Array.isArray(response.data) ? response.data : response.data.data;
            return users.filter((user) => user.roles?.HASMonteur === 2023);
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
};

/**
 * Hook for fetching dashboard data
 */
export const useDashboard = <T = unknown>(options: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> = {}) => {
    return useFetch<T>(queryKeys.dashboard, '/api/dashboard', options);
};

interface MutationOptions<TData, TVariables> extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
    invalidateKeys?: QueryKey[];
}

/**
 * Generic mutation hook with cache invalidation
 */
export const useApiMutation = <TData, TVariables>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options: MutationOptions<TData, TVariables> = {}
) => {
    const queryClient = useQueryClient();
    const { invalidateKeys = [], ...mutationOptions } = options;

    return useMutation<TData, Error, TVariables>({
        mutationFn,
        onSuccess: (data, variables, context) => {
            // Invalidate specified cache keys
            invalidateKeys.forEach((key) => {
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
export const useUpdateApartment = (options: MutationOptions<Apartment, { apartmentId: string; data: Partial<Apartment> }> = {}) => {
    const axiosPrivate = useAxiosPrivate();

    return useApiMutation<Apartment, { apartmentId: string; data: Partial<Apartment> }>(
        async ({ apartmentId, data }) => {
            const response = await axiosPrivate.put<Apartment>(`/api/apartments/${apartmentId}`, data);
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
export const useUpdateBuilding = (options: MutationOptions<Building, { buildingId: string; data: Partial<Building> }> = {}) => {
    const axiosPrivate = useAxiosPrivate();

    return useApiMutation<Building, { buildingId: string; data: Partial<Building> }>(
        async ({ buildingId, data }) => {
            const response = await axiosPrivate.put<Building>(`/api/buildings/${buildingId}`, data);
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
export const useCreateCity = (options: MutationOptions<City, Partial<City>> = {}) => {
    const axiosPrivate = useAxiosPrivate();

    return useApiMutation<City, Partial<City>>(
        async (data) => {
            const response = await axiosPrivate.post<City>('/api/cities', data);
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
export const useDeleteCity = (options: MutationOptions<void, string> = {}) => {
    const axiosPrivate = useAxiosPrivate();

    return useApiMutation<void, string>(
        async (cityId) => {
            await axiosPrivate.delete(`/api/cities/${cityId}`);
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
export const useCreateArea = (options: MutationOptions<Area, Partial<Area>> = {}) => {
    const axiosPrivate = useAxiosPrivate();

    return useApiMutation<Area, Partial<Area>>(
        async (data) => {
            const response = await axiosPrivate.post<Area>('/api/areas', data);
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
export const useDeleteArea = (options: MutationOptions<void, string> = {}) => {
    const axiosPrivate = useAxiosPrivate();

    return useApiMutation<void, string>(
        async (areaId) => {
            await axiosPrivate.delete(`/api/areas/${areaId}`);
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
