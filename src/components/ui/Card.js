// Reusable Card component for consistent content containers
// Usage: <Card title="Settings" icon="⚙️">Content</Card>

import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

const Card = ({
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
        className
    ].filter(Boolean).join(' ');

    const CardWrapper = onClick ? 'button' : 'div';

    return (
        <CardWrapper 
            className={cardClasses} 
            onClick={onClick}
            type={onClick ? 'button' : undefined}
            {...props}
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
            <div className="ui-card__content">
                {children}
            </div>
        </CardWrapper>
    );
};

// Sub-component for card footer
const CardFooter = ({ children, className = '' }) => (
    <div className={`ui-card__footer ${className}`}>
        {children}
    </div>
);

CardFooter.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

Card.Footer = CardFooter;

Card.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    icon: PropTypes.node,
    actions: PropTypes.node,
    variant: PropTypes.oneOf(['default', 'outlined', 'elevated', 'warning', 'success', 'danger']),
    padding: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
    className: PropTypes.string,
    onClick: PropTypes.func,
    hoverable: PropTypes.bool,
};

export default Card;
