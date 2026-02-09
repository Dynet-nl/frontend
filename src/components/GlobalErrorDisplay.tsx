// Global error display component that shows error messages from the ErrorProvider.

import React from 'react';
import { useError } from '../context/ErrorProvider';
import '../styles/globalError.css';

const GlobalErrorDisplay: React.FC = () => {
    const { errors, removeError } = useError();

    if (errors.length === 0) return null;

    return (
        <div className="global-error-container" role="alert" aria-live="polite">
            {errors.map((error) => (
                <div
                    key={error.id}
                    className={`global-error-item global-error-${error.type}`}
                >
                    <div className="global-error-icon">
                        {error.type === 'error' && '❌'}
                        {error.type === 'warning' && '⚠️'}
                        {error.type === 'info' && 'ℹ️'}
                    </div>
                    <div className="global-error-message">{error.message}</div>
                    <button
                        className="global-error-close"
                        onClick={() => removeError(error.id)}
                        aria-label="Dismiss error"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
};

export default GlobalErrorDisplay;
