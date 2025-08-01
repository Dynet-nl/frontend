// Custom hook for handling JWT token refresh operations and automatic token renewal.

import axios from 'axios'
import useAuth from './useAuth'
const useRefreshToken = () => {
    const {setAuth} = useAuth()
    const refresh = async () => {
        const response = await axios.get('/refresh', {
            withCredentials: true,
        })
        setAuth((prev) => {
            return {...prev, accessToken: response.data.accessToken}
        })
        return response.data.accessToken
    }
    return refresh
}
export default useRefreshToken
