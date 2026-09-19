// Panels, stat tiles, key/value rows and progress bars.

import React from 'react';
import Icon from './Icon';

interface PanelProps {
    title?: React.ReactNode;
    icon?: string;
    actions?: React.ReactNode;
    flush?: boolean;
    footer?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
    large?: boolean;
}

export const Panel: React.FC<PanelProps> = ({ title, icon, actions, flush, footer, className = '', children, large }) => (
    <section className={`panel ${large ? 'panel--l' : ''} ${className}`.trim()}>
        {(title || actions) && (
            <header className="panel__header">
                {title && (
                    <h3 className="panel__title">
                        {icon && <Icon name={icon} />}
                        {title}
                    </h3>
                )}
                {actions && <div className="ml-auto row">{actions}</div>}
            </header>
        )}
        <div className={`panel__body ${flush ? 'panel__body--flush' : ''}`.trim()}>{children}</div>
        {footer && <footer className="panel__footer">{footer}</footer>}
    </section>
);

interface StatProps {
    label: string;
    value: React.ReactNode;
    unit?: React.ReactNode;
    percent?: number;
    tone?: 'accent' | 'warn' | 'info' | 'danger' | 'none';
}

export const Stat: React.FC<StatProps> = ({ label, value, unit, percent, tone = 'accent' }) => (
    <div className={`stat ${tone !== 'accent' ? `stat--${tone}` : ''}`.trim()}>
        <span className="t-overline">{label}</span>
        <span className="stat__value">
            {value}
            {unit && <small>{unit}</small>}
        </span>
        {percent !== undefined && tone !== 'none' && (
            <span className="stat__bar"><span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></span>
        )}
    </div>
);

interface KVProps {
    rows: Array<{ label: string; value?: React.ReactNode; mono?: boolean; hidden?: boolean }>;
}

/** Label/value rows; rows with an undefined value are omitted (withheld data is absent, not "N/A"). */
export const KV: React.FC<KVProps> = ({ rows }) => (
    <div className="kv">
        {rows.filter((r) => !r.hidden && r.value !== undefined && r.value !== null && r.value !== '').map((r) => (
            <div className="kv__row" key={r.label}>
                <span className="kv__label">{r.label}</span>
                <span className={`kv__value ${r.mono ? 'kv__value--mono' : ''}`.trim()}>{r.value}</span>
            </div>
        ))}
    </div>
);

export const ProgressBar: React.FC<{ value: number; max?: number; size?: 'sm' | 'md' | 'lg'; warn?: boolean; className?: string }> = ({ value, max = 100, size = 'md', warn, className = '' }) => {
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    return (
        <span className={`progress ${size !== 'md' ? `progress--${size}` : ''} ${warn ? 'progress--warn' : ''} ${className}`.trim()} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${pct}%` }} />
        </span>
    );
};

/** Building thumbnail: one block per flat, bottom block = ground floor, coloured by fcStatusHas. */
export const FloorStack: React.FC<{ statuses: Array<string | number | undefined>; large?: boolean }> = ({ statuses, large }) => (
    <span className={`floors ${large ? 'floors--lg' : ''}`.trim()} aria-hidden="true">
        {statuses.map((s, i) => (
            <span key={i} className={String(s) === '2' ? 'is-done' : String(s) === '1' ? 'is-progress' : ''} />
        ))}
    </span>
);
