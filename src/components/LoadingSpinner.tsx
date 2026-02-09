// Standardized loading spinner component for consistent loading states across the app.

import React from 'react';
import { BounceLoader } from 'react-spinners';
import '../styles/loading.css';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
    text?: string;
    fullPage?: boolean;
    overlay?: boolean;
}

const sizeMap = {
    small: 30,
    medium: 50,
    large: 70,
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'medium',
    color = '#3498db',
    text,
    fullPage = false,
    overlay = false,
}) => {
    const spinnerSize = sizeMap[size];

    if (fullPage) {
        return (
            <div className="loading-fullpage">
                <div className="loading-content">
                    <BounceLoader color={color} size={spinnerSize} />
                    {text && <p className="loading-text">{text}</p>}
                </div>
            </div>
        );
    }

    if (overlay) {
        return (
            <div className="loading-overlay">
                <div className="loading-content">
                    <BounceLoader color={color} size={spinnerSize} />
                    {text && <p className="loading-text">{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="loading-inline">
            <BounceLoader color={color} size={spinnerSize} />
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
