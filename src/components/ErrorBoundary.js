// React error boundary component for catching and handling application errors gracefully.

import React from 'react';
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null,
            errorId: null
        };
    }
    static getDerivedStateFromError(error) {
        return { 
            hasError: true,
            errorId: Date.now().toString(36)
        };
    }
    componentDidCatch(error, errorInfo) {
        const errorDetails = {
            error: error.toString(),
            errorInfo: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 Error Boundary Caught an Error');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('Error Details:', errorDetails);
            console.groupEnd();
        }
    }
    handleRetry = () => {
        this.setState({ 
            hasError: false, 
            error: null, 
            errorInfo: null,
            errorId: null 
        });
    };
    handleReload = () => {
        window.location.reload();
    };
    render() {
        if (this.state.hasError) {
            const { fallback: Fallback } = this.props;
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
                        <div className="error-boundary-icon">
                            ⚠️
                        </div>
                        <h1 className="error-boundary-title">
                            Oops! Something went wrong
                        </h1>
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
                                    <pre>{this.state.errorInfo.componentStack}</pre>
                                </div>
                            </details>
                        )}
                        <div className="error-boundary-actions">
                            <button 
                                onClick={this.handleRetry}
                                className="modern-button modern-button-primary"
                            >
                                Try Again
                            </button>
                            <button 
                                onClick={this.handleReload}
                                className="modern-button modern-button-secondary"
                            >
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
