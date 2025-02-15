import {Navigate, Outlet, useLocation} from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const RequireAuth = ({allowedRoles}) => {
    const {auth} = useAuth();
    const location = useLocation();

    // Convert roles object to array of role values
    const rolesArray = auth?.roles ? Object.values(auth.roles) : [];
    const hasAllowedRole = allowedRoles ? rolesArray.some(role => allowedRoles.includes(role)) : true;

    if (!auth?.accessToken) {
        return <Navigate to="/login" state={{from: location}} replace/>;
    } else if (!hasAllowedRole) {
        return <Navigate to="/unauthorized" state={{from: location}} replace/>;
    }

    return <Outlet/>;
};

export default RequireAuth;