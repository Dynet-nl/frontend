import React from 'react'
import {Link, useNavigate} from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import '../styles/nav.css'
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ROLES_LIST from "../context/roles_list";

const Navbar = () => {
    const {auth, setAuth} = useAuth()
    const navigate = useNavigate()
    
    // Role checks
    const isAdmin = auth?.roles?.includes(ROLES_LIST.Admin) // Use 5150 from ROLES_LIST
    const hasTechnischePlanningRole = auth?.roles?.includes(ROLES_LIST.TechnischePlanning)
    const hasHASPlanningRole = auth?.roles?.includes(ROLES_LIST.HASPlanning)
    const hasTechnischeSchouwerRole = auth?.roles?.includes(ROLES_LIST.TechnischeSchouwer)
    const hasHASMonteurRole = auth?.roles?.includes(ROLES_LIST.HASMonteur)
    
    // Check if user should see HAS Agenda
    const canSeeHASAgenda = isAdmin || hasHASPlanningRole || hasTechnischeSchouwerRole || hasHASMonteurRole
    
    // Check if user should see Planning Agenda
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
            <Link style={{fontSize: 20}} to='/'>Home</Link>
            
            {/* Dashboard only for Admin users */}
            {isAdmin && (
                <Link style={{fontSize: 20}} to='/dashboard'>Dashboard</Link>
            )}
            
            <Link style={{fontSize: 20}} to='/city'>Cities</Link>
            {canSeePlanningAgenda && (
                <Link style={{fontSize: 20}} to='/agenda'>Planning Agenda</Link>
            )}
            {canSeeHASAgenda && (
                <Link style={{fontSize: 20}} to='/has-agenda'>HAS Agenda</Link>
            )}
            {isAdmin && (
                <Link style={{fontSize: 20}} to='/admin'>Admin page</Link>
            )}
            <Typography variant="h6" component="div">
                Role: {currentRoles}
            </Typography>
            <Button onClick={logout}>Sign Out</Button>
        </nav>
    )
}

export default Navbar