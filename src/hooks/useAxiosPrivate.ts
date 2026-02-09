// Custom hook providing axios instance with automatic token refresh for authenticated requests.
// Note: JWT tokens are now stored in httpOnly cookies, automatically sent by the browser.

import { useEffect, useRef, useCallback } from 'react';
import { AxiosInstance, AxiosError } from 'axios';
import axiosPrivate, { axiosPublic } from '../api/axios';
import logger from '../utils/logger';
import useAuth from './useAuth';

// Refresh state to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

const subscribeToTokenRefresh = (callback: () => void): void => {
    refreshSubscribers.push(callback);
};

const onTokenRefreshed = (): void => {
    refreshSubscribers.forEach(callback => callback());
    refreshSubscribers = [];
};

interface ExtendedAxiosRequestConfig {
    sent?: boolean;
    headers: Record<string, string>;
    [key: string]: unknown;
}

const useAxiosPrivate = (): AxiosInstance => {
    const { logout } = useAuth();
    const logoutRef = useRef<() => void>(logout);

    // Keep refs updated
    useEffect(() => {
        logoutRef.current = logout;
    }, [logout]);

    const refreshToken = useCallback(async (): Promise<void> => {
        try {
            logger.log('Token expired, attempting refresh...');
            // The refresh endpoint will set a new accessToken httpOnly cookie
            await axiosPublic.get('/refresh', {
                withCredentials: true
            });
            logger.log('Token refresh successful');
        } catch (refreshError) {
            logger.error('Token refresh failed:', refreshError);
            logoutRef.current();
            throw refreshError;
        }
    }, []);

    useEffect(() => {
        // No request interceptor needed - httpOnly cookies are sent automatically
        // with withCredentials: true (configured in axios.ts)

        const responseIntercept = axiosPrivate.interceptors.response.use(
            response => response,
            async (error: AxiosError) => {
                const prevRequest = error?.config as ExtendedAxiosRequestConfig | undefined;

                if (error.response?.status === 403 && prevRequest && !prevRequest.sent) {
                    if (isRefreshing) {
                        // Wait for the ongoing refresh to complete
                        return new Promise((resolve) => {
                            subscribeToTokenRefresh(() => {
                                resolve(axiosPrivate.request(prevRequest));
                            });
                        });
                    }

                    prevRequest.sent = true;
                    isRefreshing = true;

                    try {
                        await refreshToken();
                        isRefreshing = false;
                        onTokenRefreshed();
                        // Retry the original request - the new cookie will be sent automatically
                        return axiosPrivate.request(prevRequest);
                    } catch (refreshError) {
                        isRefreshing = false;
                        refreshSubscribers = [];
                        return Promise.reject(refreshError);
                    }
                }

                if (error.response?.status === 401) {
                    logoutRef.current();
                }

                return Promise.reject(error);
            }
        );

        return () => {
            axiosPrivate.interceptors.response.eject(responseIntercept);
        };
    }, [refreshToken]);

    return axiosPrivate;
};

export default useAxiosPrivate;
