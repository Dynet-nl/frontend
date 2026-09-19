// App-level error boundary: last resort when the shell itself fails to render.

import React, { Component, ReactNode, ErrorInfo, ComponentType } from 'react';

interface FallbackProps {
    error: Error | null;
    errorInfo: ErrorInfo | null;
    onRetry: () => void;
    onReload: () => void;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ComponentType<FallbackProps>;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ error, errorInfo });
        if (process.env.NODE_ENV === 'development') {
            console.error('Error boundary:', error, errorInfo);
        }
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (!this.state.hasError) return this.props.children;

        const Fallback = this.props.fallback;
        if (Fallback) {
            return <Fallback error={this.state.error} errorInfo={this.state.errorInfo} onRetry={this.handleRetry} onReload={this.handleReload} />;
        }

        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div className="state state--error" style={{ maxWidth: 520 }} role="alert">
                    <span className="icon state__icon">error</span>
                    <div className="state__title">Er ging iets mis</div>
                    <div className="state__text">De app kon niet worden weergegeven. Probeer het opnieuw of herlaad de pagina.</div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{ marginTop: 8 }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Details</summary>
                            <pre className="mono" style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                    <div className="btn-group" style={{ marginTop: 8 }}>
                        <button type="button" className="btn btn--primary" onClick={this.handleRetry}>
                            <span>Opnieuw proberen</span>
                        </button>
                        <button type="button" className="btn btn--secondary" onClick={this.handleReload}>
                            <span>Pagina herladen</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
