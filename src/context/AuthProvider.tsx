// React context provider for managing global authentication state and user information.

import React, { createContext, useCallback, useState, useEffect, useMemo, ReactNode } from 'react';
import logger from '../utils/logger';

// Types
export interface AuthState {
    isAuthenticated?: boolean;
    roles?: number[];
    email?: string;
}

export interface AuthContextType {
    auth: AuthState;
    setAuth: React.Dispatch<React.SetStateAction<AuthState>>;
    logout: () => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

// Create context with undefined default (will be checked in useAuth hook)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialAuth = (): AuthState => {
    // Note: accessToken is now stored in httpOnly cookie by the backend
    // We only check for roles in localStorage to determine if user was previously authenticated
    let roles: number[] = [];
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

    if (Array.isArray(roles) && roles.length > 0) {
        return { isAuthenticated: true, roles: roles };
    }

    if (storedRoles) {
        localStorage.removeItem('roles');
    }

    return {};
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [auth, setAuth] = useState<AuthState>(getInitialAuth);

    // Sync auth state across browser tabs
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent): void => {
            if (event.key === 'roles') {
                const newAuth = getInitialAuth();
                setAuth(newAuth);

                // If logged out in another tab, redirect to login
                if (!newAuth.isAuthenticated && auth.isAuthenticated) {
                    window.location.href = '/tool/login';
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [auth.isAuthenticated]);

    const logout = useCallback((): void => {
        // Note: The httpOnly cookie will be cleared by the backend logout endpoint
        // We only clear the roles from localStorage for UI state
        localStorage.removeItem('roles');
        setAuth({});
        window.location.href = '/tool/login';
    }, []);

    const value = useMemo<AuthContextType>(
        () => ({ auth, setAuth, logout }),
        [auth, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
