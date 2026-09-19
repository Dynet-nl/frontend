// Buttons. One primary per view (ink); the recurring "Inplannen" verb uses the accent variant.

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'dense' | 'touch';

interface BaseProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: string;
    iconRight?: string;
    loading?: boolean;
    block?: boolean;
    className?: string;
    children?: React.ReactNode;
}

type ButtonProps = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

const classes = ({ variant = 'secondary', size = 'default', loading, block, className = '', iconOnly = false }: BaseProps & { iconOnly?: boolean }) =>
    [
        'btn',
        `btn--${variant}`,
        size !== 'default' ? `btn--${size}` : '',
        loading ? 'btn--loading' : '',
        block ? 'btn--block' : '',
        iconOnly ? 'btn--icon' : '',
        className,
    ].filter(Boolean).join(' ');

const Button: React.FC<ButtonProps> = ({ variant, size, icon, iconRight, loading, block, className, children, type = 'button', disabled, ...rest }) => (
    <button
        type={type}
        className={classes({ variant, size, loading, block, className, iconOnly: !children })}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
    >
        {icon && <Icon name={icon} />}
        {children && <span>{children}</span>}
        {iconRight && <Icon name={iconRight} />}
    </button>
);

type LinkButtonProps = BaseProps & { to: string; state?: unknown; title?: string };

export const LinkButton: React.FC<LinkButtonProps> = ({ to, state, variant, size, icon, iconRight, block, className, children, title }) => (
    <Link to={to} state={state} className={classes({ variant, size, block, className, iconOnly: !children })} title={title}>
        {icon && <Icon name={icon} />}
        {children && <span>{children}</span>}
        {iconRight && <Icon name={iconRight} />}
    </Link>
);

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    icon: string;
    label: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, label, variant = 'ghost', size = 'default', className = '', type = 'button', ...rest }) => (
    <button type={type} className={classes({ variant, size, className, iconOnly: true })} aria-label={label} title={label} {...rest}>
        <Icon name={icon} />
    </button>
);

export default Button;
