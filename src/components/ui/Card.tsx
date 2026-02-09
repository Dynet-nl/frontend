// Reusable Card component for consistent content containers
// Usage: <Card title="Settings" icon="⚙️">Content</Card>

import React, { ReactNode, HTMLAttributes } from 'react';
import './Card.css';

type CardVariant = 'default' | 'outlined' | 'elevated' | 'warning' | 'success' | 'danger';
type CardPadding = 'none' | 'small' | 'medium' | 'large';

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    variant?: CardVariant;
    padding?: CardPadding;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

interface CardFooterProps {
    children: ReactNode;
    className?: string;
}

interface CardComponent extends React.FC<CardProps> {
    Footer: React.FC<CardFooterProps>;
}

const Card: CardComponent = ({
    children,
    title,
    subtitle,
    icon,
    actions,
    variant = 'default',
    padding = 'medium',
    className = '',
    onClick,
    hoverable = false,
    ...props
}) => {
    const cardClasses = [
        'ui-card',
        `ui-card--${variant}`,
        `ui-card--padding-${padding}`,
        hoverable && 'ui-card--hoverable',
        onClick && 'ui-card--clickable',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const CardWrapper = onClick ? 'button' : 'div';

    return (
        <CardWrapper
            className={cardClasses}
            onClick={onClick}
            type={onClick ? 'button' : undefined}
            {...(props as HTMLAttributes<HTMLElement>)}
        >
            {(title || icon || actions) && (
                <div className="ui-card__header">
                    <div className="ui-card__header-content">
                        {icon && <span className="ui-card__icon">{icon}</span>}
                        <div className="ui-card__titles">
                            {title && <h3 className="ui-card__title">{title}</h3>}
                            {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
                        </div>
                    </div>
                    {actions && <div className="ui-card__actions">{actions}</div>}
                </div>
            )}
            <div className="ui-card__content">{children}</div>
        </CardWrapper>
    );
};

// Sub-component for card footer
const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
    <div className={`ui-card__footer ${className}`}>{children}</div>
);

Card.Footer = CardFooter;

export default Card;
