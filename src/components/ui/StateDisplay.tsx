// Loading, empty, error and forbidden states.

import React from 'react';
import Icon from './Icon';
import Button from './Button';
import { t } from '../../i18n';

export const Skeleton: React.FC<{ width?: number | string; height?: number | string; className?: string; style?: React.CSSProperties }> = ({ width = '100%', height = 12, className = '', style }) => (
    <span className={`skeleton ${className}`.trim()} style={{ display: 'block', width, height, ...style }} aria-hidden="true" />
);

export const SkeletonRows: React.FC<{ rows?: number; label?: string }> = ({ rows = 4, label }) => (
    <div className="skeleton-rows" role="status" aria-live="polite" aria-label={label ?? t('state.loading')}>
        {Array.from({ length: rows }).map((_, i) => (
            <div className="skeleton-row" key={i}>
                <Skeleton width={18} height={18} />
                <Skeleton width={`${30 + ((i * 17) % 40)}%`} />
                <Skeleton width={60} className="ml-auto" />
                <Skeleton width={90} height={22} />
            </div>
        ))}
    </div>
);

interface StateProps {
    title?: string;
    text?: string;
    icon?: string;
    action?: React.ReactNode;
    center?: boolean;
}

export const EmptyState: React.FC<StateProps> = ({ title, text, icon = 'inbox', action, center }) => (
    <div className={`state ${center ? 'state--center' : ''}`.trim()}>
        <Icon name={icon} className="state__icon" />
        {title && <div className="state__title">{title}</div>}
        {text && <div className="state__text">{text}</div>}
        {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
);

export const ErrorState: React.FC<StateProps & { onRetry?: () => void; message?: string }> = ({ title, text, message, onRetry, center }) => (
    <div className={`state state--error ${center ? 'state--center' : ''}`.trim()} role="alert">
        <Icon name="cloud_off" className="state__icon" />
        <div className="state__title">{title ?? message ?? t('state.error.title')}</div>
        <div className="state__text">{text ?? (message ? undefined : t('state.error.text'))}</div>
        {onRetry && (
            <Button variant="secondary" icon="refresh" onClick={onRetry} style={{ marginTop: 4 }}>
                {t('common.retry')}
            </Button>
        )}
    </div>
);

export const ForbiddenState: React.FC<{ text?: string }> = ({ text }) => (
    <div className="state" role="alert">
        <Icon name="lock" className="state__icon" />
        <div className="state__title">{t('state.forbidden.title')}</div>
        <div className="state__text">{text ?? t('state.forbidden.text')}</div>
    </div>
);

/** Kept for existing call sites: a quiet inline loading row. */
export const LoadingState: React.FC<{ message?: string }> = ({ message }) => (
    <div className="row gap-2 muted t-small" role="status" aria-live="polite" style={{ padding: 16 }}>
        <Skeleton width={16} height={16} style={{ borderRadius: 999 }} />
        {message ?? t('state.loading')}
    </div>
);

/** Thin bar at the very top while a page navigation is in flight. */
export const TopProgress: React.FC = () => <div className="topbar-progress" role="progressbar" aria-label={t('state.loading')} />;

export const SuccessState = EmptyState;
