// Route-level error boundary component for catching and handling page-specific errors.

import React, { Component, ReactNode, ErrorInfo, CSSProperties, MouseEvent } from 'react';

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
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(_error: Error): Partial<RouteErrorBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({
            error: error,
            errorInfo: errorInfo,
        });

        if (process.env.NODE_ENV === 'development') {
            console.group('Route Error Boundary');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.groupEnd();
        }
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            const { pageName = 'This page' } = this.props;

            const containerStyle: CSSProperties = {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                padding: '40px 20px',
                textAlign: 'center',
            };

            const iconStyle: CSSProperties = {
                fontSize: '64px',
                marginBottom: '20px',
            };

            const titleStyle: CSSProperties = {
                color: '#2c3e50',
                fontSize: '24px',
                marginBottom: '12px',
            };

            const messageStyle: CSSProperties = {
                color: '#6c757d',
                fontSize: '16px',
                marginBottom: '24px',
                maxWidth: '400px',
            };

            const detailsStyle: CSSProperties = {
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                maxWidth: '600px',
                textAlign: 'left',
            };

            const preStyle: CSSProperties = {
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
            };

            const primaryButtonStyle: CSSProperties = {
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                backgroundColor: '#3498db',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
            };

            const secondaryButtonStyle: CSSProperties = {
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#6c757d',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
            };

            return (
                <div style={containerStyle}>
                    <div style={iconStyle}>⚠️</div>
                    <h2 style={titleStyle}>{pageName} encountered an error</h2>
                    <p style={messageStyle}>
                        Something went wrong while loading this section. You can try again or go back to the dashboard.
                    </p>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={detailsStyle}>
                            <summary style={{ cursor: 'pointer', fontWeight: '600' }}>Error Details (Dev Only)</summary>
                            <pre style={preStyle}>
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={this.handleRetry}
                            style={primaryButtonStyle}
                            onMouseOver={(e: MouseEvent<HTMLButtonElement>) =>
                                ((e.target as HTMLButtonElement).style.backgroundColor = '#2980b9')
                            }
                            onMouseOut={(e: MouseEvent<HTMLButtonElement>) =>
                                ((e.target as HTMLButtonElement).style.backgroundColor = '#3498db')
                            }
                        >
                            Try Again
                        </button>
                        <button
                            onClick={this.handleGoHome}
                            style={secondaryButtonStyle}
                            onMouseOver={(e: MouseEvent<HTMLButtonElement>) =>
                                ((e.target as HTMLButtonElement).style.backgroundColor = '#e9ecef')
                            }
                            onMouseOut={(e: MouseEvent<HTMLButtonElement>) =>
                                ((e.target as HTMLButtonElement).style.backgroundColor = '#f8f9fa')
                            }
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default RouteErrorBoundary;
