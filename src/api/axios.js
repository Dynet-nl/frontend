import axios from 'axios'

const axiosPrivate = axios.create({
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('roles');
      
      // Force reload to clear all state and redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosPrivate
