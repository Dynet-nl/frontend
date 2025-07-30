// Custom hook for managing user authentication state and authentication-related operations.

import {useContext} from 'react';
import AuthContext from '../context/AuthProvider';
const useAuth = () => {
    return useContext(AuthContext);
};
export default useAuth;
