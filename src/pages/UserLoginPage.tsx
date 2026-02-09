// User authentication page with login form, validation, and session management.

import React, { useEffect, useRef, useState, FormEvent, ChangeEvent } from 'react';
import useAuth from '../hooks/useAuth';
import { axiosPublic } from '../api/axios';
import '../styles/login.css';
import { useLocation, useNavigate, Location } from 'react-router-dom';
import { UI_CONFIG } from '../utils/constants';
import { AxiosError } from 'axios';

// Login status stages
const LOGIN_STAGES = {
    IDLE: 'idle',
    VALIDATING: 'validating',
    CONNECTING: 'connecting',
    AUTHENTICATING: 'authenticating',
    LOADING_PROFILE: 'loading_profile',
    REDIRECTING: 'redirecting',
    SUCCESS: 'success',
    ERROR: 'error',
} as const;

type LoginStage = (typeof LOGIN_STAGES)[keyof typeof LOGIN_STAGES];

const STATUS_MESSAGES: Record<LoginStage, string> = {
    [LOGIN_STAGES.IDLE]: '',
    [LOGIN_STAGES.VALIDATING]: '🔍 Validating credentials...',
    [LOGIN_STAGES.CONNECTING]: '🌐 Connecting to server...',
    [LOGIN_STAGES.AUTHENTICATING]: '🔐 Authenticating...',
    [LOGIN_STAGES.LOADING_PROFILE]: '👤 Loading your profile...',
    [LOGIN_STAGES.REDIRECTING]: '✨ Success! Redirecting...',
    [LOGIN_STAGES.SUCCESS]: '✅ Login successful!',
    [LOGIN_STAGES.ERROR]: '❌ Login failed',
};

interface LocationState {
    from?: {
        pathname: string;
    };
}

interface AuthResponse {
    roles: number[];
    // Note: accessToken is now stored in httpOnly cookie by the backend
}

const UserLoginPage: React.FC = () => {
    const { setAuth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation() as Location<LocationState>;
    const from = location.state?.from?.pathname || '/';
    const userRef = useRef<HTMLInputElement>(null);
    const errRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [errMsg, setErrMsg] = useState<string>('');
    const [loginStage, setLoginStage] = useState<LoginStage>(LOGIN_STAGES.IDLE);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isLoading = ![LOGIN_STAGES.IDLE, LOGIN_STAGES.SUCCESS, LOGIN_STAGES.ERROR].includes(loginStage);

    useEffect(() => {
        userRef.current?.focus();
    }, []);

    useEffect(() => {
        setErrMsg('');
    }, [email, password]);

    // Timer to show elapsed time during login
    useEffect(() => {
        if (isLoading) {
            setElapsedTime(0);
            timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + UI_CONFIG.TIMER_INTERVAL);
            }, UI_CONFIG.TIMER_INTERVAL);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isLoading]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setErrMsg('');

        // Stage 1: Validating
        setLoginStage(LOGIN_STAGES.VALIDATING);
        await new Promise((resolve) => setTimeout(resolve, UI_CONFIG.LOGIN_VALIDATION_DELAY));

        if (!email || !password) {
            setLoginStage(LOGIN_STAGES.ERROR);
            setErrMsg('Please enter both email and password');
            return;
        }

        // Stage 2: Connecting
        setLoginStage(LOGIN_STAGES.CONNECTING);

        try {
            // Stage 3: Authenticating
            setLoginStage(LOGIN_STAGES.AUTHENTICATING);

            const response = await axiosPublic.post<AuthResponse>(
                '/auth',
                { email, password },
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true,
                }
            );

            // Stage 4: Loading profile
            setLoginStage(LOGIN_STAGES.LOADING_PROFILE);
            await new Promise((resolve) => setTimeout(resolve, UI_CONFIG.LOGIN_PROFILE_DELAY));

            const roles = response?.data?.roles;
            // Note: accessToken is now stored in httpOnly cookie by the backend
            // We only store roles in localStorage for UI purposes (role-based rendering)
            // The actual auth token is managed via httpOnly cookies for security
            localStorage.setItem('roles', JSON.stringify(roles));
            setAuth({ email, roles, isAuthenticated: true });

            // Stage 5: Redirecting
            setLoginStage(LOGIN_STAGES.REDIRECTING);
            await new Promise((resolve) => setTimeout(resolve, UI_CONFIG.LOGIN_REDIRECT_DELAY));

            setEmail('');
            setPassword('');
            setLoginStage(LOGIN_STAGES.SUCCESS);
            navigate(from, { replace: true });
        } catch (err) {
            setLoginStage(LOGIN_STAGES.ERROR);

            const error = err as AxiosError<{ message?: string }>;
            if (!error?.response) {
                setErrMsg('🔌 No Server Response - The server might be starting up. Please wait a moment and try again.');
            } else if (error.response?.status === 400) {
                setErrMsg('📝 Missing Username or Password - Please fill in all fields.');
            } else if (error.response?.status === 401) {
                setErrMsg('🚫 Invalid Credentials - Please check your email and password.');
            } else if (error.response?.status === 403) {
                setErrMsg('⛔ Access Denied - Your account may be disabled.');
            } else if (error.response?.status === 429) {
                setErrMsg('⏳ Too Many Attempts - Please wait a few minutes before trying again.');
            } else if (error.response?.status && error.response.status >= 500) {
                setErrMsg('🔧 Server Error - Our servers are experiencing issues. Please try again later.');
            } else {
                setErrMsg(`❌ Login Failed - ${error.message || 'An unexpected error occurred.'}`);
            }

            setTimeout(() => {
                errRef.current?.focus();
            }, 0);
        }
    };

    const formatTime = (ms: number): string => {
        return (ms / 1000).toFixed(1);
    };

    const getStageColor = (): string => {
        switch (loginStage) {
            case LOGIN_STAGES.ERROR:
                return '#dc3545';
            case LOGIN_STAGES.SUCCESS:
            case LOGIN_STAGES.REDIRECTING:
                return '#28a745';
            default:
                return '#667eea';
        }
    };

    const getProgressWidth = (): string => {
        switch (loginStage) {
            case LOGIN_STAGES.VALIDATING:
                return '20%';
            case LOGIN_STAGES.CONNECTING:
                return '40%';
            case LOGIN_STAGES.AUTHENTICATING:
                return '60%';
            case LOGIN_STAGES.LOADING_PROFILE:
                return '80%';
            case LOGIN_STAGES.REDIRECTING:
                return '95%';
            default:
                return '100%';
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
            }}
        >
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    padding: '40px',
                    width: '100%',
                    maxWidth: '400px',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <img src="/dynetLogo.png" alt="Dynet Logo" style={{ width: '80px', marginBottom: '20px' }} />
                    <h1
                        style={{
                            color: '#2c3e50',
                            fontSize: '28px',
                            fontWeight: '700',
                            margin: '0 0 10px 0',
                        }}
                    >
                        Welcome Back
                    </h1>
                    <p
                        style={{
                            color: '#6c757d',
                            fontSize: '16px',
                            margin: '0',
                        }}
                    >
                        Sign in to your Fiber Installation Management System
                    </p>
                </div>

                {/* Status Display */}
                {loginStage !== LOGIN_STAGES.IDLE && (
                    <div
                        style={{
                            marginBottom: '20px',
                            padding: '16px',
                            borderRadius: '12px',
                            backgroundColor: loginStage === LOGIN_STAGES.ERROR ? '#fff5f5' : '#f8f9ff',
                            border: `2px solid ${getStageColor()}`,
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {/* Progress Bar */}
                        {isLoading && (
                            <div
                                style={{
                                    height: '4px',
                                    backgroundColor: '#e9ecef',
                                    borderRadius: '2px',
                                    marginBottom: '12px',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        backgroundColor: getStageColor(),
                                        borderRadius: '2px',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                        width: getProgressWidth(),
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </div>
                        )}

                        {/* Status Message */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                            }}
                        >
                            {isLoading && (
                                <div
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '3px solid #e9ecef',
                                        borderTopColor: getStageColor(),
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite',
                                    }}
                                />
                            )}
                            <span
                                style={{
                                    color: getStageColor(),
                                    fontWeight: '600',
                                    fontSize: '14px',
                                }}
                            >
                                {STATUS_MESSAGES[loginStage]}
                            </span>
                        </div>

                        {/* Elapsed Time */}
                        {isLoading && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginTop: '8px',
                                    fontSize: '12px',
                                    color: '#6c757d',
                                }}
                            >
                                ⏱️ {formatTime(elapsedTime)}s
                            </div>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {errMsg && (
                    <div
                        ref={errRef}
                        tabIndex={-1}
                        style={{
                            marginBottom: '20px',
                            padding: '15px',
                            borderRadius: '8px',
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c6cb',
                            color: '#721c24',
                            textAlign: 'center',
                            outline: 'none',
                            fontSize: '14px',
                            lineHeight: '1.5',
                        }}
                        aria-live="assertive"
                    >
                        {errMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modern-form">
                    <div className="modern-form-group">
                        <label htmlFor="email" className="modern-label">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="modern-input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            ref={userRef}
                            autoComplete="email"
                            required
                            disabled={isLoading}
                            style={{ opacity: isLoading ? 0.7 : 1 }}
                        />
                    </div>
                    <div className="modern-form-group">
                        <label htmlFor="password" className="modern-label">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="modern-input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            disabled={isLoading}
                            style={{ opacity: isLoading ? 0.7 : 1 }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="modern-button modern-button-primary"
                        style={{
                            width: '100%',
                            marginTop: '10px',
                            opacity: isLoading ? 0.7 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite',
                                    }}
                                />
                                Signing In...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div
                    style={{
                        textAlign: 'center',
                        marginTop: '30px',
                        padding: '20px 0',
                        borderTop: '1px solid #e9ecef',
                    }}
                >
                    <p
                        style={{
                            color: '#6c757d',
                            fontSize: '13px',
                            margin: '0',
                        }}
                    >
                        🔒 Secure access to your workspace
                    </p>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

export default UserLoginPage;
