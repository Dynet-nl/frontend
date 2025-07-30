// React context provider for managing cache invalidation across the application.

import { createContext, useContext, useState, useCallback } from 'react';
const CacheInvalidationContext = createContext();
export const CacheInvalidationProvider = ({ children }) => {
    const [cacheInvalidationCallbacks, setCacheInvalidationCallbacks] = useState(new Map());
    const registerCacheInvalidation = useCallback((key, callback) => {
        setCacheInvalidationCallbacks(prev => {
            const newMap = new Map(prev);
            newMap.set(key, callback);
            return newMap;
        });
        return () => {
            setCacheInvalidationCallbacks(prev => {
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
            });
        };
    }, []);
    const invalidateCache = useCallback((pattern) => {
        cacheInvalidationCallbacks.forEach((callback, key) => {
            if (pattern === '*' || key.includes(pattern) || pattern.includes(key)) {
                console.log(`Invalidating cache for key: ${key}`);
                callback();
            }
        });
    }, [cacheInvalidationCallbacks]);
    const value = {
        registerCacheInvalidation,
        invalidateCache
    };
    return (
        <CacheInvalidationContext.Provider value={value}>
            {children}
        </CacheInvalidationContext.Provider>
    );
};
export const useCacheInvalidation = () => {
    const context = useContext(CacheInvalidationContext);
    if (!context) {
        throw new Error('useCacheInvalidation must be used within a CacheInvalidationProvider');
    }
    return context;
};
export default CacheInvalidationContext;
