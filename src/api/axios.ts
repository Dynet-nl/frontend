// Axios configuration for API requests including base URL, interceptors, and request/response handling.

import axios, { AxiosInstance } from 'axios';

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

// Note: Response interceptors are handled in useAxiosPrivate hook
// to avoid duplicate interceptors and enable proper token refresh

export { axiosPublic, BASE_URL };
export default axiosPrivate;
