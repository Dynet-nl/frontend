import { useRef, useState, useEffect, useContext } from 'react'
// import AuthContext from '../context/AuthProvider'
import useAuth from '../hooks/useAuth'
import axios from 'axios'
import '../styles/login.css'
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { Link, useNavigate, useLocation } from 'react-router-dom'

const Login = () => {
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const userRef = useRef()
  const errRef = useRef()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    userRef.current.focus()
  }, [])

  useEffect(() => {
    setErrMsg('')
  }, [email, password])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.post('/auth',
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        },
      )

      const roles = response?.data?.roles
      const accessToken = response?.data?.accessToken

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('roles', JSON.stringify(roles))

      setAuth({ email, password, roles, accessToken })

      setEmail('')
      setPassword('')

      navigate(from, { replace: true })
    } catch (err) {
      if (!err?.response) {
        setErrMsg('No Server Response')
      } else if (err.response?.status === 400) {
        setErrMsg('Missing Username or Password')
      } else if (err.response?.status === 401) {
        setErrMsg('Unauthorized')
      } else {
        setErrMsg('Login Failed')
      }
      errRef.current.focus()
    }
  }

  return (
    <section className="loginContainer">
      <p
        ref={errRef}
        className={errMsg ? 'errmsg' : 'offscreen'}
        aria-live="assertive"
      >
        {errMsg}
      </p>

      <h1 style={{ marginBottom: '20px' }}>Sign In</h1>

      <form className="login" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          id="username"
          autoComplete="off"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          required
          variant="outlined"
          fullWidth
          inputRef={userRef}
          style={{ marginBottom: '20px' }}
        />

        <TextField
          label="Password"
          type="password"
          id="password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          required
          variant="outlined"
          fullWidth
          style={{ marginBottom: '20px' }}
        />

        <Button type="submit" variant="contained" style={{ marginTop: '20px' }}>Sign In</Button>
      </form>

    </section>
  )
}

export default Login