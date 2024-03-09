import { useLocation, Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const RequireAuth = ({ allowedRoles }) => {
  const { auth } = useAuth();
  const location = useLocation();

  const hasAllowedRole = allowedRoles ? auth?.roles?.some(role => allowedRoles.includes(role)) : true;

  console.log("Access token is ", auth.accessToken);

  console.log("Has allowed role? ", hasAllowedRole);

  if (!auth?.accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  } else if (!hasAllowedRole) {
    // If the user doesn't have an allowed role, redirect to the unauthorized page
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // If the user has an access token and the required role(s), render the requested page
  return <Outlet />;
};

export default RequireAuth;
