// React context provider for the signed-in user's roles and sign-out.
//
// The access/refresh tokens live in httpOnly cookies managed by the API; the client only
// remembers the role list (localStorage) to decide which routes and menus to show.

import React, { createContext, useCallback, useState, useEffect, useMemo, ReactNode } from 'react';
import { axiosPublic, setUnauthorizedHandler } from '../api/axios';
import logger from '../utils/logger';

export interface AuthState {
    isAuthenticated?: boolean;
    roles?: number[];
    email?: string;
    name?: string;
}

export interface AuthContextType {
    auth: AuthState;
    setAuth: React.Dispatch<React.SetStateAction<AuthState>>;
    logout: () => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

const ROLES_KEY = 'roles';
const LOGIN_PATH = `${process.env.PUBLIC_URL || ''}/login`;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredRoles = (): number[] => {
    const stored = localStorage.getItem(ROLES_KEY);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((r) => typeof r === 'number')) return parsed;
    } catch (error) {
        logger.warn('Failed to parse stored roles:', error);
    }
    localStorage.removeItem(ROLES_KEY);
    return [];
};

const getInitialAuth = (): AuthState => {
    const roles = readStoredRoles();
    return roles.length > 0 ? { isAuthenticated: true, roles } : {};
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [auth, setAuth] = useState<AuthState>(getInitialAuth);

    const logout = useCallback((): void => {
        localStorage.removeItem(ROLES_KEY);
        setAuth({});
        // Revoke the session server-side (best effort), then hard-navigate so every
        // in-memory cache from the previous user is dropped.
        axiosPublic
            .post('/logout')
            .catch((error) => logger.warn('Logout request failed:', error))
            .finally(() => {
                window.location.href = LOGIN_PATH;
            });
    }, []);

    // The axios interceptor calls this when the session cannot be refreshed.
    useEffect(() => {
        setUnauthorizedHandler(logout);
        return () => setUnauthorizedHandler(null);
    }, [logout]);

    // Sync auth state across browser tabs (login/logout in another tab).
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent): void => {
            if (event.key !== ROLES_KEY && event.key !== null) return;
            const next = getInitialAuth();
            setAuth(next);
            if (!next.isAuthenticated && auth.isAuthenticated) {
                window.location.href = LOGIN_PATH;
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [auth.isAuthenticated]);

    const value = useMemo<AuthContextType>(() => ({ auth, setAuth, logout }), [auth, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
