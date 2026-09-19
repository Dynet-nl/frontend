// Filter chips with counts, and a segmented control.

import React from 'react';
import Icon from './Icon';

interface ChipProps {
    active?: boolean;
    count?: number;
    danger?: boolean;
    touch?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({ active, count, danger, touch, onClick, children }) => (
    <button
        type="button"
        className={`chip ${active ? 'chip--active' : ''} ${danger ? 'chip--danger' : ''} ${touch ? 'chip--touch' : ''}`.trim()}
        onClick={onClick}
        aria-pressed={active}
    >
        {children}
        {count !== undefined && <span className="chip__count">{count}</span>}
    </button>
);

interface SegmentedOption<T extends string> {
    value: T;
    label: React.ReactNode;
    icon?: string;
}

interface SegmentedProps<T extends string> {
    value: T;
    options: SegmentedOption<T>[];
    onChange: (value: T) => void;
    ink?: boolean;
    'aria-label'?: string;
}

export function Segmented<T extends string>({ value, options, onChange, ink, ...rest }: SegmentedProps<T>): React.ReactElement {
    return (
        <div className={`seg ${ink ? 'seg--ink' : ''}`.trim()} role="tablist" aria-label={rest['aria-label']}>
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={opt.value === value}
                    className={`seg__item ${opt.value === value ? 'seg__item--active' : ''}`.trim()}
                    onClick={() => onChange(opt.value)}
                >
                    {opt.icon && <Icon name={opt.icon} />}
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
