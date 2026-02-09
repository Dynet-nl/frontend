// Custom hook for monitoring application performance including render times and API response times.

import { useEffect, useRef, useState, useCallback, DependencyList } from 'react';
import logger from '../utils/logger';

interface PerformanceData {
    renderCount: number;
    averageRenderTime: number;
    slowRenders: number;
}

const usePerformanceMonitor = (componentName: string): PerformanceData => {
    const mountTime = useRef<number>(Date.now());
    const renderCount = useRef<number>(0);
    const [performanceData, setPerformanceData] = useState<PerformanceData>({
        renderCount: 0,
        averageRenderTime: 0,
        slowRenders: 0,
    });

    useEffect(() => {
        renderCount.current += 1;
        const renderStart = performance.now();

        return () => {
            const renderEnd = performance.now();
            const renderTime = renderEnd - renderStart;
            const isSlowRender = renderTime > 16;

            setPerformanceData((prev) => ({
                renderCount: renderCount.current,
                averageRenderTime:
                    (prev.averageRenderTime * (renderCount.current - 1) + renderTime) / renderCount.current,
                slowRenders: prev.slowRenders + (isSlowRender ? 1 : 0),
            }));

            if (process.env.NODE_ENV === 'development') {
                if (isSlowRender) {
                    logger.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
                }
                if (renderCount.current % 50 === 0) {
                    console.info(`📊 Performance stats for ${componentName}:`, {
                        renders: renderCount.current,
                        avgRenderTime: performanceData.averageRenderTime.toFixed(2) + 'ms',
                        slowRenders: performanceData.slowRenders,
                        uptime: ((Date.now() - mountTime.current) / 1000).toFixed(1) + 's',
                    });
                }
            }
        };
    });

    return performanceData;
};

interface OptimizedAPIOptions {
    cacheKey?: string;
    cacheDuration?: number;
    retryAttempts?: number;
    retryDelay?: number;
}

interface OptimizedAPIResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<T | undefined>;
    clearCache: () => void;
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface RequestRef {
    cancel?: () => void;
}

export const useOptimizedAPI = <T>(
    fetchFunction: (signal: AbortSignal) => Promise<T>,
    dependencies: DependencyList = [],
    options: OptimizedAPIOptions = {}
): OptimizedAPIResult<T> => {
    const { cacheKey, cacheDuration = 5 * 60 * 1000, retryAttempts = 3, retryDelay = 1000 } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const requestRef = useRef<RequestRef | null>(null);
    const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
    const retryCountRef = useRef<number>(0);

    const fetchData = useCallback(
        async (force: boolean = false): Promise<T | undefined> => {
            if (!force && cacheKey) {
                const cached = cacheRef.current.get(cacheKey);
                if (cached && Date.now() - cached.timestamp < cacheDuration) {
                    setData(cached.data);
                    setLoading(false);
                    return cached.data;
                }
            }

            if (requestRef.current) {
                requestRef.current.cancel?.();
            }

            setLoading(true);
            setError(null);

            try {
                const abortController = new AbortController();
                requestRef.current = {
                    cancel: () => abortController.abort(),
                };

                const result = await fetchFunction(abortController.signal);

                if (cacheKey) {
                    cacheRef.current.set(cacheKey, {
                        data: result,
                        timestamp: Date.now(),
                    });
                }

                setData(result);
                retryCountRef.current = 0;
                return result;
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }

                if (retryCountRef.current < retryAttempts) {
                    retryCountRef.current += 1;
                    setTimeout(() => fetchData(force), retryDelay * retryCountRef.current);
                    return;
                }

                setError(err instanceof Error ? err : new Error('Unknown error'));
                logger.error('API call failed:', err);
            } finally {
                setLoading(false);
                requestRef.current = null;
            }
        },
        [fetchFunction, cacheKey, cacheDuration, retryAttempts, retryDelay]
    );

    useEffect(() => {
        fetchData();
        return () => {
            if (requestRef.current) {
                requestRef.current.cancel?.();
            }
        };
    }, dependencies);

    return {
        data,
        loading,
        error,
        refetch: () => fetchData(true),
        clearCache: () => cacheRef.current.clear(),
    };
};

export default usePerformanceMonitor;
