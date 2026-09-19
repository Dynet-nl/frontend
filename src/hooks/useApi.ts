// Small data-fetching hook: GET a URL with the authenticated axios instance,
// expose data/loading/error/reload. No caching layer; pages are small.

import { useCallback, useEffect, useRef, useState } from 'react';
import axiosPrivate from '../api/axios';
import { getErrorMessage } from '../context/ErrorProvider';

interface UseApiOptions<T> {
    enabled?: boolean;
    params?: Record<string, unknown>;
    transform?: (raw: unknown) => T;
    deps?: unknown[];
}

interface UseApiResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    status: number | null;
    reload: () => Promise<void>;
    setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useApi<T>(url: string | null, options: UseApiOptions<T> = {}): UseApiResult<T> {
    const { enabled = true, params, transform, deps = [] } = options;
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(!!url && enabled);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<number | null>(null);
    const requestId = useRef(0);
    const paramsKey = JSON.stringify(params ?? null);

    const load = useCallback(async () => {
        if (!url || !enabled) {
            setLoading(false);
            return;
        }
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const response = await axiosPrivate.get(url, { params: params ?? undefined });
            if (id !== requestId.current) return;
            setStatus(response.status);
            setData(transform ? transform(response.data) : (response.data as T));
        } catch (err) {
            if (id !== requestId.current) return;
            const s = (err as { response?: { status?: number } }).response?.status ?? null;
            setStatus(s);
            setError(getErrorMessage(err));
        } finally {
            if (id === requestId.current) setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, enabled, paramsKey, ...deps]);

    useEffect(() => {
        load();
    }, [load]);

    return { data, loading, error, status, reload: load, setData };
}
