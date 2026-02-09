// Higher-order component for protecting routes based on user authentication and role requirements.

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

interface RequireAuthProps {
    allowedRoles?: number[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({ allowedRoles }) => {
    const { auth } = useAuth();
    const location = useLocation();

    const hasAllowedRole = allowedRoles ? auth?.roles?.some((role) => allowedRoles.includes(role)) : true;

    if (!auth?.isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    } else if (!hasAllowedRole) {
        return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default RequireAuth;
