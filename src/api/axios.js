// Axios configuration for API requests including base URL, interceptors, and request/response handling.

import axios from 'axios'

const BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://backend-dynet2-1.onrender.com'
        : 'http://localhost:5500')

const axiosPublic = axios.create({
    baseURL: BASE_URL,
    headers: {'Content-Type': 'application/json'},
    withCredentials: true,
})

const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: {'Content-Type': 'application/json'},
    withCredentials: true,
})

axiosPrivate.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('roles')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export { axiosPublic }
export default axiosPrivate
