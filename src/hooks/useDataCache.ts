// Custom hook for caching API responses with automatic refresh and performance optimization.

import { useState, useEffect, useCallback, useRef, DependencyList } from 'react';
import { AxiosInstance } from 'axios';
import logger from '../utils/logger';
import useAxiosPrivate from './useAxiosPrivate';
import useLocalStorage from './useLocalStorage';
import { useCacheInvalidation } from '../context/CacheInvalidationProvider';

interface UseDataCacheResult<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<T | null>;
    invalidateCache: () => void;
    isCacheValid: boolean;
    lastFetchTime: number | null;
}

const useDataCache = <T>(
    cacheKey: string | null,
    fetchFunction: (axios: AxiosInstance) => Promise<T>,
    dependencies: DependencyList = []
): UseDataCacheResult<T> => {
    const axiosPrivate = useAxiosPrivate();
    const safeCacheKey = cacheKey || `temp_${Date.now()}`;
    const shouldUseCache = !!cacheKey;

    const [cachedData, setCachedData] = useLocalStorage<T | null>(safeCacheKey, null);
    const [lastFetchTime, setLastFetchTime] = useLocalStorage<number | null>(`${safeCacheKey}_timestamp`, null);
    const [data, setData] = useState<T | null>(shouldUseCache ? cachedData : null);
    const [isLoading, setIsLoading] = useState<boolean>(shouldUseCache && !cachedData);
    const [error, setError] = useState<Error | null>(null);
    const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { registerCacheInvalidation } = useCacheInvalidation();

    const CACHE_DURATION = 5 * 60 * 1000;
    const AUTO_REFRESH_INTERVAL = 30 * 1000;

    const isCacheValid = useCallback((): boolean => {
        if (!shouldUseCache || !lastFetchTime) return false;
        return Date.now() - lastFetchTime < CACHE_DURATION;
    }, [shouldUseCache, lastFetchTime]);

    const fetchData = useCallback(
        async (forceRefresh: boolean = false): Promise<T | null> => {
            if (!shouldUseCache) {
                setData(null);
                setIsLoading(false);
                return null;
            }

            if (!forceRefresh && isCacheValid() && cachedData) {
                setData(cachedData);
                setIsLoading(false);
                return cachedData;
            }

            setIsLoading(true);
            setError(null);

            try {
                const result = await fetchFunction(axiosPrivate);
                if (result !== null && result !== undefined) {
                    setCachedData(result);
                    setLastFetchTime(Date.now());
                    setData(result);
                } else {
                    if (cachedData) {
                        setData(cachedData);
                    }
                }
                return result;
            } catch (err) {
                logger.error(`Error fetching data for ${cacheKey}:`, err);
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error);
                if (cachedData) {
                    setData(cachedData);
                }
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [shouldUseCache, axiosPrivate, fetchFunction, cacheKey, isCacheValid, cachedData, setCachedData, setLastFetchTime]
    );

    const startAutoRefresh = useCallback((): void => {
        if (autoRefreshRef.current) {
            clearInterval(autoRefreshRef.current);
        }
        autoRefreshRef.current = setInterval(async () => {
            try {
                await fetchData(true);
            } catch (error) {
                logger.error(`Auto-refresh failed for ${cacheKey}:`, error);
            }
        }, AUTO_REFRESH_INTERVAL);
    }, [fetchData, cacheKey]);

    const stopAutoRefresh = useCallback((): void => {
        if (autoRefreshRef.current) {
            clearInterval(autoRefreshRef.current);
            autoRefreshRef.current = null;
        }
    }, []);

    const invalidateCache = useCallback((): void => {
        setCachedData(null);
        setLastFetchTime(null);
        setData(null);
    }, [setCachedData, setLastFetchTime]);

    useEffect(() => {
        if (shouldUseCache) {
            fetchData();
        }
    }, [...dependencies, fetchData]);

    useEffect(() => {
        if (shouldUseCache && data && !isLoading) {
            startAutoRefresh();
        }
        return () => {
            stopAutoRefresh();
        };
    }, [shouldUseCache, data, isLoading, startAutoRefresh, stopAutoRefresh]);

    useEffect(() => {
        return () => {
            stopAutoRefresh();
        };
    }, [stopAutoRefresh]);

    useEffect(() => {
        if (shouldUseCache && cacheKey) {
            const unregister = registerCacheInvalidation(cacheKey, invalidateCache);
            return unregister;
        }
    }, [shouldUseCache, cacheKey, registerCacheInvalidation, invalidateCache]);

    return {
        data,
        isLoading,
        error,
        refetch: () => fetchData(true),
        invalidateCache,
        isCacheValid: isCacheValid(),
        lastFetchTime,
    };
};

export default useDataCache;
