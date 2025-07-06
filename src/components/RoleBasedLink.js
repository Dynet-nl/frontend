import React from 'react';
import {Link} from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ROLES_LIST from "../context/roles_list";

const RoleBasedLink = ({ children, flatId, buildingId, className, type }) => {
    const { auth } = useAuth();

    
    console.log("Auth object:", auth);
    console.log("Auth roles:", auth.roles);

    
    const hasRole = (roleValue) => {
        return auth?.roles && Array.isArray(auth.roles) && auth.roles.includes(roleValue);
    };

    
    const isAdmin = hasRole(ROLES_LIST.Admin);
    const isTechnischePlanning = hasRole(ROLES_LIST.TechnischePlanning);
    const isHASPlanning = hasRole(ROLES_LIST.HASPlanning);
    const isTechnischeSchouwer = hasRole(ROLES_LIST.TechnischeSchouwer);
    const isHASMonteur = hasRole(ROLES_LIST.HASMonteur);

    console.log("Has HASPlanning role:", isHASPlanning);

    let path = '/';

    
    if (type === 'schedule' && buildingId) {
        if (isHASPlanning) {
            path = `/has-planning-apartment-schedule/${buildingId}`;
            console.log("Using HASPlanning schedule path");
        } else if (isTechnischePlanning) {
            path = `/planning-apartment-schedule/${buildingId}`;
            console.log("Using TechnischePlanning schedule path");
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

    console.log("Final path:", path);

    return (
        <Link to={path} className={className}>
            {children}
        </Link>
    );
};

export default RoleBasedLink;