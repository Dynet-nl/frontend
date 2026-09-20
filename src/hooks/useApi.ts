// Small data-fetching hook: GET a URL with the authenticated axios instance, expose
// data/loading/error/reload. A short in-memory cache makes going back to a page instant:
// cached data renders at once while a fresh copy is fetched (stale-while-revalidate).

import { useCallback, useEffect, useRef, useState } from 'react';
import axiosPrivate from '../api/axios';
import { getErrorMessage } from '../context/ErrorProvider';

interface UseApiOptions<T> {
    enabled?: boolean;
    params?: Record<string, unknown>;
    transform?: (raw: unknown) => T;
    deps?: unknown[];
    /** Skip the cache for this call (defaults to using it). */
    cache?: boolean;
}

interface UseApiResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    status: number | null;
    reload: () => Promise<void>;
    setData: React.Dispatch<React.SetStateAction<T | null>>;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();

/** Forget everything (called on logout so the next user never sees stale data). */
export const clearApiCache = (): void => cache.clear();

export function useApi<T>(url: string | null, options: UseApiOptions<T> = {}): UseApiResult<T> {
    const { enabled = true, params, transform, deps = [], cache: useCache = true } = options;
    const paramsKey = JSON.stringify(params ?? null);
    const cacheKey = url ? `${url}|${paramsKey}` : null;
    const cached = useCache && cacheKey ? cache.get(cacheKey) : undefined;
    const fresh = cached && Date.now() - cached.at < CACHE_TTL_MS ? (cached.data as T) : null;

    const [data, setDataState] = useState<T | null>(fresh);
    const [loading, setLoading] = useState<boolean>(!!url && enabled && fresh === null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<number | null>(null);
    const requestId = useRef(0);
    const lastKey = useRef(cacheKey);

    const setData: React.Dispatch<React.SetStateAction<T | null>> = useCallback((next) => {
        setDataState((prev) => {
            const resolved = typeof next === 'function' ? (next as (p: T | null) => T | null)(prev) : next;
            if (cacheKey && resolved !== null) cache.set(cacheKey, { data: resolved, at: Date.now() });
            return resolved;
        });
    }, [cacheKey]);

    const load = useCallback(async () => {
        if (!url || !enabled) {
            setLoading(false);
            return;
        }
        const id = ++requestId.current;
        const hit = useCache && cacheKey ? cache.get(cacheKey) : undefined;
        const usable = hit && Date.now() - hit.at < CACHE_TTL_MS;
        if (lastKey.current !== cacheKey) {
            // Navigated to a different resource: show its cached copy (or a skeleton), never the old page's data.
            lastKey.current = cacheKey;
            setDataState(usable ? (hit.data as T) : null);
        }
        setLoading(!usable);
        setError(null);
        try {
            const response = await axiosPrivate.get(url, { params: params ?? undefined });
            if (id !== requestId.current) return;
            const value = transform ? transform(response.data) : (response.data as T);
            setStatus(response.status);
            setDataState(value);
            if (cacheKey) cache.set(cacheKey, { data: value, at: Date.now() });
        } catch (err) {
            if (id !== requestId.current) return;
            const s = (err as { response?: { status?: number } }).response?.status ?? null;
            setStatus(s);
            setError(getErrorMessage(err));
        } finally {
            if (id === requestId.current) setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, enabled, paramsKey, useCache, ...deps]);

    useEffect(() => {
        load();
    }, [load]);

    return { data, loading, error, status, reload: load, setData };
}
