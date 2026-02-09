// Reusable Button component with consistent styling and loading states
// Usage: <Button variant="primary" loading={isLoading}>Save</Button>

import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'link';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: ReactNode;
    className?: string;
}

const Button: React.FC<ButtonProps> = ({
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
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button type={type} className={buttonClasses} disabled={disabled || loading} onClick={onClick} {...props}>
            {loading && (
                <span className="ui-button__spinner" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="ui-button__spinner-icon">
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="31.4 31.4"
                        />
                    </svg>
                </span>
            )}
            {icon && !loading && <span className="ui-button__icon">{icon}</span>}
            <span className="ui-button__text">{children}</span>
        </button>
    );
};

export default Button;
