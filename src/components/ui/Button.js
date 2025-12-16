// Reusable Button component with consistent styling and loading states
// Usage: <Button variant="primary" loading={isLoading}>Save</Button>

import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    type = 'button',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon = null,
    onClick,
    className = '',
    ...props
}) => {
    const buttonClasses = [
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        fullWidth && 'ui-button--full-width',
        loading && 'ui-button--loading',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={buttonClasses}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading && (
                <span className="ui-button__spinner" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="ui-button__spinner-icon">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" />
                    </svg>
                </span>
            )}
            {icon && !loading && <span className="ui-button__icon">{icon}</span>}
            <span className="ui-button__text">{children}</span>
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'ghost', 'link']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    fullWidth: PropTypes.bool,
    icon: PropTypes.node,
    onClick: PropTypes.func,
    className: PropTypes.string,
};

export default Button;
