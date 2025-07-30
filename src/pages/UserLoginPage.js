// User authentication page with login form, validation, and session management.

import {useEffect, useRef, useState} from 'react'
import useAuth from '../hooks/useAuth'
import axios from 'axios'
import '../styles/login.css'
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
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
        userRef.current.focus()
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
            errRef.current.focus()
        }
    }
    return (
        <div className="login-page">
            <div className="login-background">
                <div className="login-card">
                    <div className="login-header">
                        <img 
                            src="/dynetLogo.png" 
                            alt="Dynet Logo" 
                            className="login-logo"
                        />
                        <h1 className="login-title">Welcome Back</h1>
                        <p className="login-subtitle">Sign in to your Fiber Installation Management System</p>
                    </div>
                    <div 
                        className={`error-message ${errMsg ? 'show' : ''}`}
                        ref={errRef}
                        aria-live="assertive"
                    >
                        {errMsg}
                    </div>
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <TextField
                                label="Email"
                                type="email"
                                id="username"
                                autoComplete="email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                required
                                variant="outlined"
                                fullWidth
                                inputRef={userRef}
                                className="modern-input"
                                sx={{
                                    marginBottom: '20px',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        backgroundColor: '#ffffff',
                                        height: '54px',
                                        '& fieldset': {
                                            borderColor: '#e1e5e9',
                                            borderWidth: '1px',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#3498db',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#3498db',
                                            borderWidth: '2px',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#6c757d',
                                        fontWeight: '400',
                                        '&.Mui-focused': {
                                            color: '#3498db',
                                        },
                                        '&.MuiInputLabel-shrink': {
                                            backgroundColor: '#ffffff',
                                            padding: '0 8px',
                                            marginLeft: '-4px',
                                        }
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        padding: '15px 16px',
                                        fontSize: '16px',
                                        color: '#2c3e50',
                                    }
                                }}
                            />
                        </div>
                        <div className="input-group">
                            <TextField
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                required
                                variant="outlined"
                                fullWidth
                                className="modern-input"
                                sx={{
                                    marginBottom: '20px',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        backgroundColor: '#ffffff',
                                        height: '54px',
                                        '& fieldset': {
                                            borderColor: '#e1e5e9',
                                            borderWidth: '1px',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#3498db',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#3498db',
                                            borderWidth: '2px',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#6c757d',
                                        fontWeight: '400',
                                        '&.Mui-focused': {
                                            color: '#3498db',
                                        },
                                        '&.MuiInputLabel-shrink': {
                                            backgroundColor: '#ffffff',
                                            padding: '0 8px',
                                            marginLeft: '-4px',
                                        }
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        padding: '15px 16px',
                                        fontSize: '16px',
                                        color: '#2c3e50',
                                    }
                                }}
                            />
                        </div>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            className="login-button"
                            fullWidth
                            sx={{
                                backgroundColor: '#3498db',
                                borderRadius: '8px',
                                padding: '12px 0',
                                fontSize: '16px',
                                fontWeight: '600',
                                textTransform: 'none',
                                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
                                '&:hover': {
                                    backgroundColor: '#2980b9',
                                    boxShadow: '0 6px 16px rgba(52, 152, 219, 0.4)',
                                    transform: 'translateY(-1px)',
                                },
                                '&:active': {
                                    transform: 'translateY(0)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Sign In
                        </Button>
                    </form>
                    <div className="login-footer">
                        <p>Secure access to your workspace</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default UserLoginPage