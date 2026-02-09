// Custom hook for handling JWT token refresh operations and automatic token renewal.
// Note: The accessToken is now stored in httpOnly cookies by the backend.

import { axiosPublic } from '../api/axios';

const useRefreshToken = (): (() => Promise<void>) => {
    const refresh = async (): Promise<void> => {
        // The refresh endpoint will set a new accessToken httpOnly cookie
        await axiosPublic.get('/refresh', {
            withCredentials: true,
        });
    };

    return refresh;
};

export default useRefreshToken;
