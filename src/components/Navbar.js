import React from 'react'
import {Link, useNavigate} from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import '../styles/nav.css'
import Button from '@mui/material/Button';
import ROLES_LIST from "../context/roles_list";

const Navbar = () => {
    const {auth, setAuth} = useAuth()
    const navigate = useNavigate()
    
    
    const isAdmin = auth?.roles?.includes(ROLES_LIST.Admin) 
    const hasTechnischePlanningRole = auth?.roles?.includes(ROLES_LIST.TechnischePlanning)
    const hasHASPlanningRole = auth?.roles?.includes(ROLES_LIST.HASPlanning)
    const hasTechnischeSchouwerRole = auth?.roles?.includes(ROLES_LIST.TechnischeSchouwer)
    const hasHASMonteurRole = auth?.roles?.includes(ROLES_LIST.HASMonteur)
    
    
    const canSeeHASAgenda = isAdmin || hasHASPlanningRole || hasTechnischeSchouwerRole || hasHASMonteurRole
    
    
    const canSeePlanningAgenda = isAdmin || hasTechnischePlanningRole
    
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
    
    return (
        <nav>
            <div className="nav-brand">
                <span style={{fontSize: '24px'}}>🌐</span>
                Dynet
            </div>
            
            <div className="nav-links">
                <Link to='/'>Home</Link>
                
                {isAdmin && (
                    <Link to='/dashboard'>Dashboard</Link>
                )}
                
                <Link to='/city'>Cities</Link>
                {canSeePlanningAgenda && (
                    <Link to='/agenda'>Planning Agenda</Link>
                )}
                {canSeeHASAgenda && (
                    <Link to='/has-agenda'>HAS Agenda</Link>
                )}
                {isAdmin && (
                    <Link to='/admin'>Admin</Link>
                )}
            </div>
            
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
        </nav>
    )
}

export default Navbar