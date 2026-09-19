// Axios instances and the single auth interceptor.
//
// Auth model: the API sets httpOnly cookies (access + refresh token) at login; the browser
// attaches them automatically (withCredentials). This module owns the refresh logic so it
// is registered exactly once, not per component:
//   401 -> try GET /refresh once, then retry the original request; if the refresh fails,
//          hand over to the registered unauthorized handler (AuthProvider -> logout).
//   403 -> forbidden for this role; surfaced to the caller, never a logout.

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import logger from '../utils/logger';

const BASE_URL: string =
    process.env.REACT_APP_API_BASE_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://backend-p8or.onrender.com'
        : 'http://localhost:5500');

const axiosPublic: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

const axiosPrivate: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registered by AuthProvider; called when the session cannot be refreshed. */
export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null): void => {
    unauthorizedHandler = handler;
};

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
    _retried?: boolean;
}

// One refresh at a time; concurrent 401s wait for it.
let refreshPromise: Promise<void> | null = null;

const refreshSession = (): Promise<void> => {
    if (!refreshPromise) {
        refreshPromise = axiosPublic
            .get('/refresh')
            .then(() => undefined)
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
};

const isAuthEndpoint = (url?: string): boolean =>
    !!url && (url.includes('/refresh') || url.includes('/auth') || url.includes('/logout'));

axiosPrivate.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as RetriableRequestConfig | undefined;
        const status = error.response?.status;

        if (status === 401 && original && !original._retried && !isAuthEndpoint(original.url)) {
            original._retried = true;
            try {
                await refreshSession();
                return axiosPrivate.request(original);
            } catch (refreshError) {
                logger.warn('Session refresh failed, signing out');
                unauthorizedHandler?.();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export { axiosPublic, BASE_URL };
export default axiosPrivate;
