import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axiosPrivate from '../api/axios';

const RoleBasedLink = ({children, flatId, className}) => {
    const {auth} = useAuth();
    const [roles, setRoles] = useState({});
    const role = auth?.roles?.[0];

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await axiosPrivate.get('/api/users/roles');
                const data = response.data;
                const roleMapping = {};
                data.forEach(role => {
                    roleMapping[role.role] = role.value;
                });
                setRoles(roleMapping);
            } catch (error) {
                console.error('Failed to fetch roles:', error);
            }
        };

        fetchRoles();
    }, []);

    const getRoleBasedPath = () => {
        switch (role) {
            case roles.Admin:
                return `/admin-apartment/${flatId}`;
            case roles.TechnischePlanning:
                return `/planning-apartment/${flatId}`;
            case roles.TechnischeSchouwer:
                return `/ts-apartment/${flatId}`;
            case roles.HASPlanning:
                return `/has-planning-apartment/${flatId}`;
            default:
                return `/apartment/${flatId}`;
        }
    };

    if (Object.keys(roles).length === 0) {
        // Optionally render a loading state while fetching roles
        return null;
    }

    return (
        <Link to={getRoleBasedPath()} className={className}>
            {children}
        </Link>
    );
};

export default RoleBasedLink;
