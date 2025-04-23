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
    const isAdmin = auth?.roles?.includes(5150)
    const hasTechnischePlanningRole = auth?.roles?.includes(1991)
    const hasHASPlanningRole = auth?.roles?.includes(1959)
    const hasTechnischeSchouwerRole = auth?.roles?.includes(8687)
    const hasHASMonteurRole = auth?.roles?.includes(2023)

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