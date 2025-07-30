import React from 'react';
import {Link} from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ROLES_LIST from "../context/roles_list";
const RoleBasedLink = ({ children, flatId, buildingId, className, type }) => {
    const { auth } = useAuth();
    const hasRole = (roleValue) => {
        return auth?.roles && Array.isArray(auth.roles) && auth.roles.includes(roleValue);
    };
    const isAdmin = hasRole(ROLES_LIST.Admin);
    const isTechnischePlanning = hasRole(ROLES_LIST.TechnischePlanning);
    const isHASPlanning = hasRole(ROLES_LIST.HASPlanning);
    const isTechnischeSchouwer = hasRole(ROLES_LIST.TechnischeSchouwer);
    const isHASMonteur = hasRole(ROLES_LIST.HASMonteur);
    const hasSchedulingPermissions = isAdmin || isTechnischePlanning || isHASPlanning;
    let path = '/';
    if (type === 'schedule' && buildingId) {
        if (!hasSchedulingPermissions) {
            return null; // Don't render the pencil icon at all
        }
        if (isHASPlanning) {
            path = `/has-appointment-scheduler/${buildingId}?mode=building&type=HAS`;
        } else if (isTechnischePlanning) {
            path = `/appointment-scheduler/${buildingId}?mode=building&type=Technical`;
        } else if (isAdmin) {
            path = `/appointment-scheduler/${buildingId}?mode=building&type=Technical`;
        }
    }
    else if (flatId) {
        if (isAdmin) {
            path = `/admin-apartment/${flatId}`;
        } else if (isTechnischePlanning) {
            path = `/planning-apartment/${flatId}`;
        } else if (isTechnischeSchouwer) {
            path = `/ts-apartment/${flatId}`;
        } else if (isHASPlanning) {
            path = `/has-planning-apartment/${flatId}`;
        } else if (isHASMonteur) {
            path = `/hm-apartment/${flatId}`;
        }
    }
    return (
        <Link to={path} className={className}>
            {children}
        </Link>
    );
};
    return (
        <Link to={path} className={className}>
            {children}
        </Link>
    );
};
export default RoleBasedLink;