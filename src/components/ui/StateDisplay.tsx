// Standardized loading and error states for consistent UX across the app
// Usage: <LoadingState message="Loading buildings..." /> or <ErrorState error={error} onRetry={refetch} />

import React, { ReactNode } from 'react';
import Button from './Button';
import './StateDisplay.css';

type StateSize = 'small' | 'medium' | 'large';

// Loading State Component
interface LoadingStateProps {
    message?: string;
    size?: StateSize;
    fullPage?: boolean;
    className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Loading...',
    size = 'medium',
    fullPage = false,
    className = '',
}) => {
    const containerClasses = ['ui-state', 'ui-state--loading', `ui-state--${size}`, fullPage && 'ui-state--full-page', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={containerClasses} role="status" aria-live="polite">
            <div className="ui-state__spinner">
                <svg viewBox="0 0 50 50" className="ui-state__spinner-icon">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" />
                </svg>
            </div>
            {message && <p className="ui-state__message">{message}</p>}
        </div>
    );
};

// Error State Component
interface ErrorStateProps {
    title?: string;
    message?: string;
    error?: Error | null;
    onRetry?: () => void;
    retryText?: string;
    fullPage?: boolean;
    className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
    title = 'Something went wrong',
    message,
    error,
    onRetry,
    retryText = 'Try Again',
    fullPage = false,
    className = '',
}) => {
    const containerClasses = ['ui-state', 'ui-state--error', fullPage && 'ui-state--full-page', className]
        .filter(Boolean)
        .join(' ');

    const errorMessage = message || error?.message || 'An unexpected error occurred. Please try again.';

    return (
        <div className={containerClasses} role="alert">
            <div className="ui-state__icon ui-state__icon--error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                </svg>
            </div>
            <h3 className="ui-state__title">{title}</h3>
            <p className="ui-state__message">{errorMessage}</p>
            {onRetry && (
                <Button variant="primary" onClick={onRetry} className="ui-state__action">
                    {retryText}
                </Button>
            )}
        </div>
    );
};

// Empty State Component
interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: ReactNode;
    action?: string;
    actionText?: string;
    onAction?: () => void;
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title = 'No data found',
    message,
    icon = '📭',
    action,
    actionText,
    onAction,
    className = '',
}) => {
    const containerClasses = ['ui-state', 'ui-state--empty', className].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            <div className="ui-state__icon ui-state__icon--empty">{icon}</div>
            <h3 className="ui-state__title">{title}</h3>
            {message && <p className="ui-state__message">{message}</p>}
            {(action || onAction) && (
                <Button variant="primary" onClick={onAction} className="ui-state__action">
                    {actionText || action}
                </Button>
            )}
        </div>
    );
};

// Success State Component
interface SuccessStateProps {
    title?: string;
    message?: string;
    action?: string;
    onAction?: () => void;
    className?: string;
}

const SuccessState: React.FC<SuccessStateProps> = ({ title = 'Success!', message, action, onAction, className = '' }) => {
    const containerClasses = ['ui-state', 'ui-state--success', className].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            <div className="ui-state__icon ui-state__icon--success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12l2.5 2.5L16 9" />
                </svg>
            </div>
            <h3 className="ui-state__title">{title}</h3>
            {message && <p className="ui-state__message">{message}</p>}
            {onAction && (
                <Button variant="primary" onClick={onAction} className="ui-state__action">
                    {action}
                </Button>
            )}
        </div>
    );
};

export { LoadingState, ErrorState, EmptyState, SuccessState };
