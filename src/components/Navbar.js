import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import '../styles/nav.css'
import Button from '@mui/material/Button';

const Navbar = () => {
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const logout = async () => {
    navigate('/login')
    setAuth({})
    localStorage.removeItem('accessToken');
    localStorage.removeItem('roles')
    // create endpoint to handle two things:
    // deletes refreshToken from DB
    // erases refreshToken from httpOnly cookie
  }

  return (
    <nav>
      <Link style={{ fontSize: 20 }} to='/'>Home</Link>
      <Link style={{ fontSize: 20 }} to='/city'>Cities</Link>
      <Link style={{ fontSize: 20 }} to='/admin'>Admin page</Link>

      <Button onClick={logout}>Sign Out</Button>
    </nav>
  )
}

export default Navbar
