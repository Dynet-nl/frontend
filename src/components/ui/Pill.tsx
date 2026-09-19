// Status pills, key chips, dots and person markers.

import React from 'react';
import Icon from './Icon';
import { StatusSpec, StatusFamily, personColor } from '../../utils/status';
import { initials } from '../../utils/format';

interface PillProps {
    family?: StatusFamily | 'accent' | 'outline' | 'role';
    icon?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md';
    title?: string;
    className?: string;
}

export const Pill: React.FC<PillProps> = ({ family, icon, children, size = 'sm', title, className = '' }) => (
    <span className={`pill ${family ? `pill--${family}` : ''} ${size === 'md' ? 'pill--md' : ''} ${className}`.trim()} title={title}>
        {icon && <Icon name={icon} />}
        {children}
    </span>
);

export const StatusPill: React.FC<{ status: StatusSpec; size?: 'sm' | 'md'; hideLabel?: boolean }> = ({ status, size, hideLabel }) => (
    <Pill family={status.family} icon={status.icon} size={size} title={hideLabel ? status.label : undefined}>
        {hideLabel ? <span className="sr-only">{status.label}</span> : status.label}
    </Pill>
);

/** Inline status text (glyph + label) for table cells. */
export const StatusText: React.FC<{ status: StatusSpec }> = ({ status }) => (
    <span className={`status-text status-text--${status.family}`}>
        <Icon name={status.icon} />
        {status.label}
    </span>
);

export const KeyChip: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
    <span className="key" title={title}>{children}</span>
);

export const Dot: React.FC<{ family: StatusFamily; title?: string }> = ({ family, title }) => (
    <span className={`dot dot--${family}`} title={title} aria-hidden="true" />
);

export const Avatar: React.FC<{ name?: string; color?: string | null; size?: 'sm' | 'md' | 'lg'; index?: number }> = ({ name, color, size = 'sm', index = 7 }) => (
    <span className={`avatar ${size !== 'sm' ? `avatar--${size}` : ''}`.trim()} style={{ background: personColor(color, index) }} aria-hidden="true">
        {initials(name)}
    </span>
);

export const Person: React.FC<{ name?: string; color?: string | null; index?: number; className?: string }> = ({ name, color, index = 7, className = '' }) => (
    <span className={`person ${className}`.trim()}>
        <span className="person__dot" style={{ background: personColor(color, index) }} />
        <span>{name || '—'}</span>
    </span>
);
