// Breadcrumb navigation component for showing user's location in the app hierarchy.

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/breadcrumb.css';

export interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
    if (items.length === 0) return null;

    return (
        <nav className={`breadcrumb-nav ${className}`} aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
                <li className="breadcrumb-item">
                    <Link to="/" className="breadcrumb-link breadcrumb-home">
                        <span className="breadcrumb-icon">🏠</span>
                        <span className="breadcrumb-text">Home</span>
                    </Link>
                </li>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <li key={index} className="breadcrumb-item">
                            <span className="breadcrumb-separator">/</span>
                            {isLast || !item.path ? (
                                <span className="breadcrumb-current" aria-current="page">
                                    {item.label}
                                </span>
                            ) : (
                                <Link to={item.path} className="breadcrumb-link">
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
