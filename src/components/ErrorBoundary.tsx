// React error boundary component for catching and handling application errors gracefully.

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
    errorId: string | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
        };
    }

    static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            errorId: Date.now().toString(36),
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        const errorDetails = {
            error: error.toString(),
            errorInfo: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
        };

        this.setState({
            error: error,
            errorInfo: errorInfo,
        });

        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 Error Boundary Caught an Error');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('Error Details:', errorDetails);
            console.groupEnd();
        }
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
        });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            const Fallback = this.props.fallback;
            if (Fallback) {
                return (
                    <Fallback
                        error={this.state.error}
                        errorInfo={this.state.errorInfo}
                        onRetry={this.handleRetry}
                        onReload={this.handleReload}
                    />
                );
            }

            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-boundary-icon">⚠️</div>
                        <h1 className="error-boundary-title">Oops! Something went wrong</h1>
                        <p className="error-boundary-message">
                            We're sorry, but something unexpected happened. Our team has been notified.
                        </p>
                        {process.env.NODE_ENV === 'development' && (
                            <details className="error-boundary-details">
                                <summary>Error Details (Development Only)</summary>
                                <div className="error-boundary-stack">
                                    <strong>Error:</strong>
                                    <pre>{this.state.error && this.state.error.toString()}</pre>
                                    <strong>Component Stack:</strong>
                                    <pre>{this.state.errorInfo?.componentStack}</pre>
                                </div>
                            </details>
                        )}
                        <div className="error-boundary-actions">
                            <button onClick={this.handleRetry} className="modern-button modern-button-primary">
                                Try Again
                            </button>
                            <button onClick={this.handleReload} className="modern-button modern-button-secondary">
                                Reload Page
                            </button>
                        </div>
                        <div className="error-boundary-footer">
                            <small>Error ID: {this.state.errorId}</small>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
