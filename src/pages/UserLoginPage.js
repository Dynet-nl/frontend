// User authentication page with login form, validation, and session management.

import {useEffect, useRef, useState} from 'react'
import useAuth from '../hooks/useAuth'
import axios from 'axios'
import '../styles/login.css'
import {useLocation, useNavigate} from 'react-router-dom'
const UserLoginPage = () => {
    const {setAuth} = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from?.pathname || '/'
    const userRef = useRef()
    const errRef = useRef()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errMsg, setErrMsg] = useState('')
    useEffect(() => {
        userRef.current?.focus()
    }, [])
    useEffect(() => {
        setErrMsg('')
    }, [email, password])
    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const response = await axios.post('/auth',
                {email, password},
                {
                    headers: {'Content-Type': 'application/json'},
                    withCredentials: true,
                },
            )
            const roles = response?.data?.roles
            const accessToken = response?.data?.accessToken
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('roles', JSON.stringify(roles))
            setAuth({email, password, roles, accessToken})
            setEmail('')
            setPassword('')
            navigate(from, {replace: true})
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
            errRef.current?.focus()
        }
    }
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                padding: '40px',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <img 
                        src="/dynetLogo.png" 
                        alt="Dynet Logo" 
                        style={{ width: '80px', marginBottom: '20px' }}
                    />
                    <h1 style={{ 
                        color: '#2c3e50', 
                        fontSize: '28px', 
                        fontWeight: '700', 
                        margin: '0 0 10px 0' 
                    }}>
                        Welcome Back
                    </h1>
                    <p style={{ 
                        color: '#6c757d', 
                        fontSize: '16px', 
                        margin: '0' 
                    }}>
                        Sign in to your Fiber Installation Management System
                    </p>
                </div>
                
                {errMsg && (
                    <div 
                        ref={errRef}
                        style={{
                            marginBottom: '20px',
                            padding: '15px',
                            borderRadius: '8px',
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c6cb',
                            color: '#721c24',
                            textAlign: 'center'
                        }}
                        aria-live="assertive"
                    >
                        {errMsg}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="modern-form">
                    <div className="modern-form-group">
                        <label htmlFor="email" className="modern-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="modern-input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            ref={userRef}
                            autoComplete="email"
                            required
                        />
                    </div>
                    <div className="modern-form-group">
                        <label htmlFor="password" className="modern-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="modern-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="modern-button modern-button-primary"
                        style={{ width: '100%', marginTop: '10px' }}
                    >
                        Sign In
                    </button>
                </form>
                
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '30px',
                    padding: '20px 0',
                    borderTop: '1px solid #e9ecef'
                }}>
                    <p style={{ 
                        color: '#6c757d', 
                        fontSize: '13px', 
                        margin: '0' 
                    }}>
                        🔒 Secure access to your workspace
                    </p>
                </div>
            </div>
        </div>
    )
}
export default UserLoginPage