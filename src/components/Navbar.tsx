// Navigation bar component with role-based menu items and user authentication status.

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../styles/nav.css';
import Button from '@mui/material/Button';
import { ROLES, getRoleName } from '../utils/constants';
import ThemeToggle from './ThemeToggle';

interface NavigationLinksProps {
    mobile?: boolean;
    onLinkClick?: () => void;
}

const Navbar: React.FC = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

    const isAdmin = auth?.roles?.includes(ROLES.ADMIN);
    const hasTechnischePlanningRole = auth?.roles?.includes(ROLES.TECHNICAL_PLANNING);
    const hasHASPlanningRole = auth?.roles?.includes(ROLES.HAS_PLANNING);
    const hasTechnischeSchouwerRole = auth?.roles?.includes(ROLES.TECHNICAL_INSPECTOR);
    const hasHASMonteurRole = auth?.roles?.includes(ROLES.HAS_MONTEUR);

    const canSeeHASAgenda = isAdmin || hasHASPlanningRole || hasTechnischeSchouwerRole || hasHASMonteurRole;
    const canSeePlanningAgenda = isAdmin || hasTechnischePlanningRole;

    const isActivePath = (path: string): boolean => {
        if (path === '/') {
            return location.pathname === '/';
        }
        // For Cities link, also highlight for area, district, and building pages
        // since they are part of the cities navigation hierarchy
        if (path === '/city') {
            return (
                location.pathname.startsWith('/city') ||
                location.pathname.startsWith('/area') ||
                location.pathname.startsWith('/district') ||
                location.pathname.startsWith('/building') ||
                location.pathname.startsWith('/district-management')
            );
        }
        return location.pathname.startsWith(path);
    };

    const currentRoles = auth?.roles?.map(getRoleName).join(', ') || 'Guest';

    const toggleMobileMenu = (): void => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = (): void => {
        setIsMobileMenuOpen(false);
    };

    const NavigationLinks: React.FC<NavigationLinksProps> = ({ mobile = false, onLinkClick = () => {} }) => (
        <>
            <Link to="/" onClick={onLinkClick} className={isActivePath('/') ? 'active' : ''}>
                Home
            </Link>
            {isAdmin && (
                <Link to="/dashboard" onClick={onLinkClick} className={isActivePath('/dashboard') ? 'active' : ''}>
                    Dashboard
                </Link>
            )}
            <Link to="/city" onClick={onLinkClick} className={isActivePath('/city') ? 'active' : ''}>
                Cities
            </Link>
            {canSeePlanningAgenda && (
                <Link to="/agenda" onClick={onLinkClick} className={isActivePath('/agenda') ? 'active' : ''}>
                    Planning Agenda
                </Link>
            )}
            {canSeeHASAgenda && (
                <Link to="/has-agenda" onClick={onLinkClick} className={isActivePath('/has-agenda') ? 'active' : ''}>
                    HAS Agenda
                </Link>
            )}
            {isAdmin && (
                <Link to="/admin" onClick={onLinkClick} className={isActivePath('/admin') ? 'active' : ''}>
                    Admin
                </Link>
            )}
        </>
    );

    return (
        <nav>
            <button className="nav-brand" onClick={() => navigate('/')} type="button" aria-label="Dynet home">
                <span style={{ fontSize: '24px' }}>🌐</span>
                Dynet
            </button>

            {/* Desktop Navigation */}
            <div className="nav-links">
                <NavigationLinks />
            </div>

            {/* Right Section */}
            <div className="nav-right-section">
                {/* Mobile Menu Toggle */}
                <button
                    className={`nav-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
                    onClick={toggleMobileMenu}
                    aria-label="Toggle navigation menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User Section */}
                <div className="nav-user-section">
                    <div className="nav-user-info">
                        <div className="nav-user-role">{currentRoles}</div>
                    </div>
                    <Button
                        onClick={logout}
                        className="nav-logout-btn"
                        sx={{
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            textTransform: 'none',
                            fontSize: '14px',
                            boxShadow: '0 2px 8px rgba(231, 76, 60, 0.3)',
                            minWidth: 'auto',
                            '@media (max-width: 767px)': {
                                padding: '6px 12px',
                                fontSize: '12px',
                            },
                            '&:hover': {
                                background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4)',
                            },
                            '&:active': {
                                transform: 'translateY(0)',
                            },
                        }}
                    >
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div className={`nav-mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                <div className="nav-mobile-links">
                    <NavigationLinks mobile={true} onLinkClick={closeMobileMenu} />
                </div>
                <div className="nav-user-mobile">
                    <div className="nav-user-info">
                        <div className="nav-user-role">Role: {currentRoles}</div>
                    </div>
                    <Button
                        onClick={() => {
                            logout();
                            closeMobileMenu();
                        }}
                        fullWidth
                        sx={{
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            textTransform: 'none',
                            fontSize: '14px',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)',
                            },
                        }}
                    >
                        Sign Out
                    </Button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
