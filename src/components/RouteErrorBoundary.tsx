// Route-level error boundary: keeps the shell, replaces the page content with an error state.

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { t } from '../i18n';

interface RouteErrorBoundaryProps {
    children: ReactNode;
    pageName?: string;
}

interface RouteErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
    constructor(props: RouteErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(): Partial<RouteErrorBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ error, errorInfo });
        if (process.env.NODE_ENV === 'development') {
            console.error('Route error:', error, errorInfo);
        }
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = (): void => {
        window.location.href = `${process.env.PUBLIC_URL || ''}/`;
    };

    render(): ReactNode {
        if (!this.state.hasError) return this.props.children;
        const { pageName = 'deze pagina' } = this.props;
        return (
            <div className="state state--error" role="alert">
                <span className="icon state__icon">error</span>
                <div className="state__title">{t('state.crashed.title', { page: pageName })}</div>
                <div className="state__text">{t('state.crashed.text')}</div>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details style={{ marginTop: 8, maxWidth: 640 }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Details</summary>
                        <pre className="mono" style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
                            {this.state.error.toString()}
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </details>
                )}
                <div className="btn-group" style={{ marginTop: 8 }}>
                    <button type="button" className="btn btn--primary" onClick={this.handleRetry}>
                        <span className="icon">refresh</span>
                        <span>{t('common.retry')}</span>
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={this.handleGoHome}>
                        <span>{t('state.goHome')}</span>
                    </button>
                </div>
            </div>
        );
    }
}

export default RouteErrorBoundary;
