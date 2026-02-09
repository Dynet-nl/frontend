// React context provider for managing cache invalidation across the application.

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import logger from '../utils/logger';

type InvalidationCallback = () => void;

interface CacheInvalidationContextType {
    registerCacheInvalidation: (key: string, callback: InvalidationCallback) => () => void;
    invalidateCache: (pattern: string) => void;
}

interface CacheInvalidationProviderProps {
    children: ReactNode;
}

const CacheInvalidationContext = createContext<CacheInvalidationContextType | undefined>(undefined);

export const CacheInvalidationProvider: React.FC<CacheInvalidationProviderProps> = ({ children }) => {
    const [cacheInvalidationCallbacks, setCacheInvalidationCallbacks] = useState<Map<string, InvalidationCallback>>(
        new Map()
    );

    const registerCacheInvalidation = useCallback((key: string, callback: InvalidationCallback): (() => void) => {
        setCacheInvalidationCallbacks((prev) => {
            const newMap = new Map(prev);
            newMap.set(key, callback);
            return newMap;
        });
        return () => {
            setCacheInvalidationCallbacks((prev) => {
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
            });
        };
    }, []);

    const invalidateCache = useCallback(
        (pattern: string): void => {
            cacheInvalidationCallbacks.forEach((callback, key) => {
                if (pattern === '*' || key.includes(pattern) || pattern.includes(key)) {
                    logger.log(`Invalidating cache for key: ${key}`);
                    callback();
                }
            });
        },
        [cacheInvalidationCallbacks]
    );

    const value: CacheInvalidationContextType = {
        registerCacheInvalidation,
        invalidateCache,
    };

    return <CacheInvalidationContext.Provider value={value}>{children}</CacheInvalidationContext.Provider>;
};

export const useCacheInvalidation = (): CacheInvalidationContextType => {
    const context = useContext(CacheInvalidationContext);
    if (!context) {
        throw new Error('useCacheInvalidation must be used within a CacheInvalidationProvider');
    }
    return context;
};

export default CacheInvalidationContext;
