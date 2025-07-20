// Data caching hook with localStorage persistence and auto-refresh. Provides cached API responses with 5-minute expiry and 30-second background refresh for performance optimization.
import { useState, useEffect, useCallback, useRef } from 'react';
import useAxiosPrivate from './useAxiosPrivate';
import useLocalStorage from './useLocalStorage';
import { useCacheInvalidation } from '../context/CacheInvalidationProvider';

const useDataCache = (cacheKey, fetchFunction, dependencies = []) => {
    const axiosPrivate = useAxiosPrivate();
    
    const safeCacheKey = cacheKey || `temp_${Date.now()}`;
    const shouldUseCache = !!cacheKey;
    
    const [cachedData, setCachedData] = useLocalStorage(safeCacheKey, null);
    const [lastFetchTime, setLastFetchTime] = useLocalStorage(`${safeCacheKey}_timestamp`, null);
    const [data, setData] = useState(shouldUseCache ? cachedData : null);
    const [isLoading, setIsLoading] = useState(shouldUseCache && !cachedData);
    const [error, setError] = useState(null);
    const autoRefreshRef = useRef(null);
    
    const { registerCacheInvalidation } = useCacheInvalidation();

    const CACHE_DURATION = 5 * 60 * 1000;
    const AUTO_REFRESH_INTERVAL = 30 * 1000;

    const isCacheValid = useCallback(() => {
        if (!shouldUseCache || !lastFetchTime) return false;
        return Date.now() - lastFetchTime < CACHE_DURATION;
    }, [shouldUseCache, lastFetchTime]);

    const fetchData = useCallback(async (forceRefresh = false) => {
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
                console.log(`✅ Cache updated for ${cacheKey}:`, result?.length || 'data loaded');
            } else {
                console.warn(`⚠️ Invalid data received for ${cacheKey}`);
                if (cachedData) {
                    console.log(`Using existing cache for ${cacheKey}`);
                    setData(cachedData);
                }
            }
            
            return result;
        } catch (err) {
            console.error(`❌ Error fetching data for ${cacheKey}:`, err);
            setError(err);
            
            if (cachedData) {
                setData(cachedData);
                console.log(`📦 Using cached data for ${cacheKey} due to fetch error`);
            }
            
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [shouldUseCache, axiosPrivate, fetchFunction, cacheKey, isCacheValid, cachedData, setCachedData, setLastFetchTime]);

    const startAutoRefresh = useCallback(() => {
        if (autoRefreshRef.current) {
            clearInterval(autoRefreshRef.current);
        }

        autoRefreshRef.current = setInterval(async () => {
            try {
                console.log(`🔄 Auto-refreshing ${cacheKey}...`);
                const newData = await fetchData(true);
                if (newData) {
                    console.log(`✅ Auto-refresh completed for ${cacheKey}`);
                }
            } catch (error) {
                console.error(`❌ Auto-refresh failed for ${cacheKey}:`, error);
            }
        }, AUTO_REFRESH_INTERVAL);
    }, [fetchData, cacheKey]);

    const stopAutoRefresh = useCallback(() => {
        if (autoRefreshRef.current) {
            clearInterval(autoRefreshRef.current);
            autoRefreshRef.current = null;
        }
    }, []);

    const invalidateCache = useCallback(() => {
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
        lastFetchTime
    };
};

export default useDataCache;
