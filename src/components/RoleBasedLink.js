import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axiosPrivate from '../api/axios';

const RoleBasedLink = ({ children, flatId, className }) => {
  const { auth } = useAuth();
  const [roles, setRoles] = useState({});
  const role = auth?.roles?.[0]; // Assuming only one role per user for simplicity

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axiosPrivate.get('/api/users/roles');
        const data = response.data;
        console.log('Fetched roles:', data); // Log fetched roles
        const roleMapping = {};
        data.forEach(role => {
          roleMapping[role.role] = role.value; // Adjust according to your role structure
        });
        console.log('Role mapping:', roleMapping); // Log role mapping
        setRoles(roleMapping);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };

    fetchRoles();
  }, []);

  const getRoleBasedPath = () => {
    console.log('Current role:', role);
    console.log('Roles mapping:', roles);

    switch (role) {
      case roles.Admin:
        return `/admin-apartment/${flatId}`;
      case roles.TechnischePlanning:
        return `/planning-apartment/${flatId}`;
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
