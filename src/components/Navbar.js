import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import '../styles/nav.css'

const Navbar = () => {
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const logout = async () => {
    navigate('/login')
    setAuth({})
    // create endpoint to handle two things:
    // deletes refreshToken from DB
    // erases refreshToken from httpOnly cookie
  }

  return (
    <nav>
      <Link to='/'>Home</Link>
      <Link to='/district'>District page</Link>
      <Link to='/city'>Cities</Link>
      <Link to='/admin'>Admin page</Link>

      <button onClick={logout}>Sign Out</button>
    </nav>
  )
}

export default Navbar
