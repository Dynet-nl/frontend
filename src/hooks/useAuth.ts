// Custom hook for managing user authentication state and authentication-related operations.

import { useContext } from 'react';
import AuthContext, { AuthContextType } from '../context/AuthProvider';

const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default useAuth;
