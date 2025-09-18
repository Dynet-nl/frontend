// Navigation bar component with role-based menu items and user authentication status.

import React, { useState } from 'react'
import {Link, useNavigate, useLocation} from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import '../styles/nav.css'
import Button from '@mui/material/Button';
import ROLES_LIST from "../context/roles_list";

const Navbar = () => {
    const {auth, setAuth} = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    
    const isAdmin = auth?.roles?.includes(ROLES_LIST.Admin) 
    const hasTechnischePlanningRole = auth?.roles?.includes(ROLES_LIST.TechnischePlanning)
    const hasHASPlanningRole = auth?.roles?.includes(ROLES_LIST.HASPlanning)
    const hasTechnischeSchouwerRole = auth?.roles?.includes(ROLES_LIST.TechnischeSchouwer)
    const hasHASMonteurRole = auth?.roles?.includes(ROLES_LIST.HASMonteur)
    
    const canSeeHASAgenda = isAdmin || hasHASPlanningRole || hasTechnischeSchouwerRole || hasHASMonteurRole
    const canSeePlanningAgenda = isAdmin || hasTechnischePlanningRole
    
    const isActivePath = (path) => {
        if (path === '/') {
            return location.pathname === '/'
        }
        return location.pathname.startsWith(path)
    }
    
    const getRoleName = (roleId) => {
        const roleName = Object.entries(ROLES_LIST).find(([_, value]) => value === roleId)?.[0]
        return roleName || 'User'
    }
    
    const currentRoles = auth?.roles?.map(roleId => getRoleName(roleId)).join(', ') || 'Guest'
    
    const logout = async () => {
        navigate('/login')
        setAuth({})
        localStorage.removeItem('accessToken');
        localStorage.removeItem('roles')
    }
    
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }
    
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false)
    }
    
    const NavigationLinks = ({ mobile = false, onLinkClick = () => {} }) => (
        <>
            <Link 
                to='/' 
                onClick={onLinkClick}
                className={isActivePath('/') ? 'active' : ''}
            >
                Home
            </Link>
            {isAdmin && (
                <Link 
                    to='/dashboard' 
                    onClick={onLinkClick}
                    className={isActivePath('/dashboard') ? 'active' : ''}
                >
                    Dashboard
                </Link>
            )}
            <Link 
                to='/city' 
                onClick={onLinkClick}
                className={isActivePath('/city') ? 'active' : ''}
            >
                Cities
            </Link>
            {canSeePlanningAgenda && (
                <Link 
                    to='/agenda' 
                    onClick={onLinkClick}
                    className={isActivePath('/agenda') ? 'active' : ''}
                >
                    Planning Agenda
                </Link>
            )}
            {canSeeHASAgenda && (
                <Link 
                    to='/has-agenda' 
                    onClick={onLinkClick}
                    className={isActivePath('/has-agenda') ? 'active' : ''}
                >
                    HAS Agenda
                </Link>
            )}
            {isAdmin && (
                <Link 
                    to='/admin' 
                    onClick={onLinkClick}
                    className={isActivePath('/admin') ? 'active' : ''}
                >
                    Admin
                </Link>
            )}
        </>
    )
    
    return (
        <nav>
            <div className="nav-brand" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
                <span style={{fontSize: '24px'}}>🌐</span>
                Dynet
            </div>
            
            {/* Desktop Navigation */}
            <div className="nav-links">
                <NavigationLinks />
            </div>
            
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
            
            {/* User Section */}
            <div className="nav-user-section">
                <div className="nav-user-info">
                    <div className="nav-user-role">
                        {currentRoles}
                    </div>
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
            
            {/* Mobile Navigation Menu */}
            <div className={`nav-mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                <div className="nav-mobile-links">
                    <NavigationLinks mobile={true} onLinkClick={closeMobileMenu} />
                </div>
                <div className="nav-user-mobile">
                    <div className="nav-user-info">
                        <div className="nav-user-role">
                            Role: {currentRoles}
                        </div>
                    </div>
                    <Button 
                        onClick={() => {
                            logout()
                            closeMobileMenu()
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
    )
}

export default Navbar