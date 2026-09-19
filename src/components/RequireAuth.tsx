// Route guard: sign-in required, optionally one of the allowed roles.

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ForbiddenState } from './ui/StateDisplay';

interface RequireAuthProps {
    allowedRoles?: number[];
    /** Render the forbidden state inside the shell instead of redirecting. */
    inline?: boolean;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ allowedRoles, inline }) => {
    const { auth } = useAuth();
    const location = useLocation();

    if (!auth?.isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    const hasAllowedRole = allowedRoles ? auth?.roles?.some((role) => allowedRoles.includes(role)) : true;
    if (!hasAllowedRole) {
        return inline ? <ForbiddenState /> : <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    return <Outlet />;
};

export default RequireAuth;
