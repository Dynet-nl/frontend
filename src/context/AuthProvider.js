// React context provider for managing global authentication state and user information.

import {createContext, useCallback, useState} from 'react';
const AuthContext = createContext({});
export const AuthProvider = ({children}) => {
    const [auth, setAuth] = useState(() => {
        const token = localStorage.getItem('accessToken');
        const roles = JSON.parse(localStorage.getItem('roles'));
        return token ? {accessToken: token, roles: roles} : {};
    });
    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('roles');
        setAuth({});
        window.location.href = '/login';
    }, []);
    return (
        <AuthContext.Provider value={{auth, setAuth, logout}}>
            {children}
        </AuthContext.Provider>
    );
};
export default AuthContext;