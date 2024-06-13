// import { useLocation, Navigate, Outlet } from 'react-router-dom';
// import useAuth from '../hooks/useAuth';

// const RequireAuth = ({ allowedRoles }) => {
//   const { auth } = useAuth();
//   const location = useLocation();

//   const hasAllowedRole = allowedRoles ? auth?.roles?.some(role => allowedRoles.includes(role)) : true;

//   console.log("Access token is ", auth.accessToken);

//   console.log("Has allowed role? ", hasAllowedRole);

//   console.log("Current user's roles: ", auth?.roles);

//   if (!auth?.accessToken) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   } else if (!hasAllowedRole) {
//     // If the user doesn't have an allowed role, redirect to the unauthorized page
//     return <Navigate to="/unauthorized" state={{ from: location }} replace />;
//   }

//   // If the user has an access token and the required role(s), render the requested page
//   return <Outlet />;
// };

// export default RequireAuth;

import { useLocation, Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const RequireAuth = ({ allowedRoles }) => {
  const { auth, setAuth } = useAuth();
  const location = useLocation();

  // Convert roles object to array of role values
  const rolesArray = auth?.roles ? Object.values(auth.roles) : [];

  console.log("Auth state:", auth);
  console.log("Roles in auth state:", rolesArray);

  const hasAllowedRole = allowedRoles ? rolesArray.some(role => allowedRoles.includes(role)) : true;

  console.log("Access token is", auth?.accessToken);
  console.log("Allowed roles:", allowedRoles);
  console.log("Has allowed role?", hasAllowedRole);

  if (!auth?.accessToken) {
    // Clear local storage and auth state
    console.log("No access token, redirecting to login");
    localStorage.removeItem('accessToken');
    localStorage.removeItem('roles');
    setAuth({});
    return <Navigate to="/login" state={{ from: location }} replace />;
  } else if (!hasAllowedRole) {
    // Clear local storage and auth state if the user is not authorized
    console.log("User does not have allowed role, redirecting to unauthorized");
    localStorage.removeItem('accessToken');
    localStorage.removeItem('roles');
    setAuth({});
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // If the user has an access token and the required role(s), render the requested page
  return <Outlet />;
};

export default RequireAuth;
