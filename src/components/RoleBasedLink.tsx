// Component generating role-specific navigation links and routing based on user permissions.

import React, { ReactNode, CSSProperties, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ROLES } from '../utils/constants';

interface Building {
    isBlocked?: boolean;
    blockReason?: string;
}

interface RoleBasedLinkProps {
    children: ReactNode;
    flatId?: string;
    buildingId?: string;
    building?: Building;
    className?: string;
    type?: 'schedule' | 'apartment';
    style?: CSSProperties;
}

const RoleBasedLink: React.FC<RoleBasedLinkProps> = ({ children, flatId, buildingId, building, className, type, style }) => {
    const { auth } = useAuth();

    if (building?.isBlocked && type === 'schedule') {
        return (
            <div
                className={className}
                style={{ ...style, cursor: 'not-allowed', opacity: 0.4 }}
                title={`Building blocked: ${building.blockReason}`}
                onClick={(e: MouseEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    alert(`This building is blocked: ${building.blockReason}`);
                }}
            >
                {children}
            </div>
        );
    }

    const hasRole = (roleValue: number): boolean => {
        return auth?.roles && Array.isArray(auth.roles) && auth.roles.includes(roleValue);
    };

    const isAdmin = hasRole(ROLES.ADMIN);
    const isTechnischePlanning = hasRole(ROLES.TECHNICAL_PLANNING);
    const isHASPlanning = hasRole(ROLES.HAS_PLANNING);
    const isTechnischeSchouwer = hasRole(ROLES.TECHNICAL_INSPECTOR);
    const isHASMonteur = hasRole(ROLES.HAS_MONTEUR);
    const isWerkvoorbereider = hasRole(ROLES.WERKVOORBEREIDER);

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
    } else if (flatId) {
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
