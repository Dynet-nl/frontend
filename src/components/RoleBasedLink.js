// Component generating role-specific navigation links and routing based on user permissions.

import React from 'react';
import {Link} from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ROLES_LIST from "../context/roles_list";
const RoleBasedLink = ({ children, flatId, buildingId, building, className, type, style }) => {
    const { auth } = useAuth();
    
    if (building?.isBlocked && type === 'schedule') {
        return (
            <div 
                className={className} 
                style={{...style, cursor: 'not-allowed', opacity: 0.4}}
                title={`Building blocked: ${building.blockReason}`}
                onClick={(e) => {
                    e.preventDefault();
                    alert(`This building is blocked: ${building.blockReason}`);
                }}
            >
                {children}
            </div>
        );
    }
    const hasRole = (roleValue) => {
        return auth?.roles && Array.isArray(auth.roles) && auth.roles.includes(roleValue);
    };
    const isAdmin = hasRole(ROLES_LIST.Admin);
    const isTechnischePlanning = hasRole(ROLES_LIST.TechnischePlanning);
    const isHASPlanning = hasRole(ROLES_LIST.HASPlanning);
    const isTechnischeSchouwer = hasRole(ROLES_LIST.TechnischeSchouwer);
    const isHASMonteur = hasRole(ROLES_LIST.HASMonteur);
    const isWerkvoorbereider = hasRole(ROLES_LIST.Werkvoorbereider);
    const hasSchedulingPermissions = isAdmin || isTechnischePlanning || isHASPlanning || isWerkvoorbereider;
    let path = '/';
    if (type === 'schedule' && buildingId) {
        if (!hasSchedulingPermissions) {
return null;
        }
        if (isHASPlanning) {
            path = `/has-appointment-scheduler/${buildingId}?mode=building&type=HAS`;
        } else if (isTechnischePlanning) {
            path = `/appointment-scheduler/${buildingId}?mode=building&type=Technical`;
        } else if (isWerkvoorbereider) {
            path = `/appointment-scheduler/${buildingId}?mode=building&type=Technical`;
        } else if (isAdmin) {
            path = `/admin-scheduling-selection/${buildingId}?mode=building`;
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
        } else if (isWerkvoorbereider) {
            path = `/planning-apartment/${flatId}`;
        }
    }
    return (
        <Link to={path} className={className} style={style}>
            {children}
        </Link>
    );
};
export default RoleBasedLink;
