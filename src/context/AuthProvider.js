// React context provider for managing global authentication state and user information.

import { createContext, useCallback, useState } from 'react';
import logger from '../utils/logger';

const AuthContext = createContext({});
export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(() => {
        const token = localStorage.getItem('accessToken');
        let roles = [];
        const storedRoles = localStorage.getItem('roles');
        if (storedRoles) {
            try {
                roles = JSON.parse(storedRoles);
            } catch (error) {
                logger.warn('Failed to parse stored roles:', error);
                localStorage.removeItem('roles');
                roles = [];
            }
        }
        if (token && Array.isArray(roles) && roles.length > 0) {
            return {accessToken: token, roles: roles};
        }
        if (token || storedRoles) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('roles');
        }
        return {};
    });
    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('roles');
        setAuth({});
        window.location.href = '/login';
    }, []);
    return (
        <AuthContext.Provider value={{ auth, setAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
export default AuthContext;