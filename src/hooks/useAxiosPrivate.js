// Axios hook with automatic JWT refresh on 403 errors and logout on 401 errors. Attaches Bearer token to all requests and integrates with AuthContext.

import {useEffect} from 'react';
import axiosPrivate from '../api/axios';
import useAuth from './useAuth';
import axios from 'axios';

const useAxiosPrivate = () => {
    const {auth, setAuth, logout} = useAuth();

    useEffect(() => {
        const requestIntercept = axiosPrivate.interceptors.request.use(
            config => {
                if (!config.headers['Authorization']) {
                    config.headers['Authorization'] = `Bearer ${auth?.accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseIntercept = axiosPrivate.interceptors.response.use(
            response => response,
            async (error) => {
                const prevRequest = error?.config;
                
                if (error.response?.status === 403 && !prevRequest?.sent) {
                    prevRequest.sent = true;
                    
                    try {
                        console.log('Token expired, attempting refresh...');
                        const refreshResponse = await axios.get('/refresh', {
                            withCredentials: true
                        });
                        
                        const newAccessToken = refreshResponse.data.accessToken;
                        
                        setAuth(prev => ({ ...prev, accessToken: newAccessToken }));
                        localStorage.setItem('accessToken', newAccessToken);
                        
                        prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                        return axiosPrivate(prevRequest);
                        
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        logout();
                    }
                }
                
                if (error.response?.status === 401) {
                    logout();
                }
                
                return Promise.reject(error);
            }
        );

        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept);
            axiosPrivate.interceptors.response.eject(responseIntercept);
        };
    }, [auth, setAuth, logout]);

    return axiosPrivate;
};

export default useAxiosPrivate;