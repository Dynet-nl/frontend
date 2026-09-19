// Signed-in user (roles, name, e-mail) and sign-out.
//
// Tokens are httpOnly cookies managed by the API; the client only remembers who is signed
// in (localStorage) to decide which routes and menus to show.

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

const ROLES_KEY = 'roles';
const USER_KEY = 'dynet.user';
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

const readStoredUser = (): { name?: string; email?: string } => {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as { name?: string; email?: string }) : {};
    } catch {
        return {};
    }
};

const getInitialAuth = (): AuthState => {
    const roles = readStoredRoles();
    return roles.length > 0 ? { isAuthenticated: true, roles, ...readStoredUser() } : {};
};

/** Called by the login page after a successful sign-in. */
export const persistSession = (roles: number[], user: { name?: string; email?: string }): void => {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [auth, setAuth] = useState<AuthState>(getInitialAuth);

    const logout = useCallback((): void => {
        localStorage.removeItem(ROLES_KEY);
        localStorage.removeItem(USER_KEY);
        setAuth({});
        axiosPublic
            .post('/logout')
            .catch((error) => logger.warn('Logout request failed:', error))
            .finally(() => {
                window.location.href = LOGIN_PATH;
            });
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(logout);
        return () => setUnauthorizedHandler(null);
    }, [logout]);

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
