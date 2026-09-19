// Sign-in. Three states: default, "server is waking up" (the API sleeps on its hosting
// tier and can take ~30 s), and locked out after too many attempts.

import React, { useEffect, useRef, useState, FormEvent } from 'react';
import { useLocation, useNavigate, Location, Navigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import useAuth from '../hooks/useAuth';
import { persistSession } from '../context/AuthProvider';
import { axiosPublic } from '../api/axios';
import { t } from '../i18n';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import Icon from '../components/ui/Icon';

interface LocationState {
    from?: { pathname: string };
}

interface AuthResponse {
    roles: number[];
    name?: string;
}

type Stage = 'idle' | 'submitting' | 'waking' | 'locked';

const WAKE_POLL_MS = 4000;

const LoginPage: React.FC = () => {
    const { auth, setAuth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation() as Location<LocationState>;
    const from = location.state?.from?.pathname || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [stage, setStage] = useState<Stage>('idle');
    const [error, setError] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const emailRef = useRef<HTMLInputElement>(null);
    const wakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const credentials = useRef({ email: '', password: '' });

    useEffect(() => {
        document.title = `${t('login.title')} · Dynet`;
        emailRef.current?.focus();
        return () => {
            if (wakeTimer.current) clearTimeout(wakeTimer.current);
            if (elapsedTimer.current) clearInterval(elapsedTimer.current);
        };
    }, []);

    useEffect(() => {
        if (stage === 'waking') {
            const started = Date.now();
            elapsedTimer.current = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
        } else if (elapsedTimer.current) {
            clearInterval(elapsedTimer.current);
            elapsedTimer.current = null;
            setElapsed(0);
        }
    }, [stage]);

    const finish = (data: AuthResponse, usedEmail: string) => {
        const roles = Array.isArray(data.roles) ? data.roles : [];
        persistSession(roles, { name: data.name, email: usedEmail });
        setAuth({ email: usedEmail, roles, name: data.name, isAuthenticated: true });
        navigate(from, { replace: true });
    };

    const attempt = async (): Promise<void> => {
        const { email: e, password: p } = credentials.current;
        try {
            const response = await axiosPublic.post<AuthResponse>('/auth', { email: e, password: p });
            finish(response.data, e);
        } catch (err) {
            const ax = err as AxiosError<{ message?: string }>;
            if (!ax.response) {
                // No response at all: the server is probably still starting. Keep trying quietly.
                setStage('waking');
                wakeTimer.current = setTimeout(attempt, WAKE_POLL_MS);
                return;
            }
            setStage('idle');
            switch (ax.response.status) {
                case 400: setError(t('login.required')); break;
                case 401: setError(t('login.invalid')); break;
                case 403: setError(t('login.blocked')); break;
                case 429: setStage('locked'); break;
                default: setError(t('login.serverError'));
            }
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError(null);
        if (!email || !password) {
            setError(t('login.required'));
            return;
        }
        credentials.current = { email, password };
        setStage('submitting');
        await attempt();
    };

    if (auth.isAuthenticated) return <Navigate to={from} replace />;

    const busy = stage === 'submitting' || stage === 'waking';
    const locked = stage === 'locked';
    const mm = String(Math.floor(elapsed / 60)).padStart(1, '0');
    const ss = String(elapsed % 60).padStart(2, '0');

    return (
        <div className="login">
            <form className="login__card" onSubmit={handleSubmit} noValidate>
                <div className="login__brand">
                    <img src={`${process.env.PUBLIC_URL}/dynetLogo.png`} alt="" width={28} />
                    <span>Dynet</span>
                </div>
                <div>
                    <h1 className="t-title-m">{t('login.title')}</h1>
                    <p className="t-small secondary">{t('login.subtitle')}</p>
                </div>

                <Field label={t('login.email')}>
                    {(id) => (
                        <Input
                            id={id}
                            ref={emailRef}
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(null); }}
                            disabled={busy || locked}
                            required
                        />
                    )}
                </Field>
                <Field label={t('login.password')}>
                    {(id) => (
                        <Input
                            id={id}
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(null); }}
                            disabled={busy || locked}
                            required
                        />
                    )}
                </Field>

                {stage === 'waking' && (
                    <div className="callout callout--info" role="status" aria-live="polite">
                        <Icon name="cloud_sync" />
                        <div>
                            <div className="callout__title">{t('login.waking.title')}</div>
                            <div>{t('login.waking.text', { elapsed: `${mm}:${ss}` })}</div>
                        </div>
                    </div>
                )}
                {locked && (
                    <div className="callout callout--danger" role="alert">
                        <Icon name="lock_clock" />
                        <div>
                            <div className="callout__title">{t('login.locked.title')}</div>
                            <div>{t('login.locked.text')}</div>
                        </div>
                    </div>
                )}
                {error && !locked && (
                    <div className="callout callout--danger" role="alert">
                        <Icon name="error" />
                        <div>{error}</div>
                    </div>
                )}

                <Button type="submit" variant="primary" block loading={busy} disabled={locked}>
                    {stage === 'waking' ? t('login.connecting') : t('login.submit')}
                </Button>
            </form>
        </div>
    );
};

export default LoginPage;
