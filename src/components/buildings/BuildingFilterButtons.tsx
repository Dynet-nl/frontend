// Filter buttons component for filtering buildings by various criteria

import React from 'react';
import type { FilterCounts } from '../../utils/buildingFilters';

interface FilterConfig {
    key: string;
    label: string;
    className?: string;
}

interface BuildingFilterButtonsProps {
    currentFilter: string;
    filterCounts: FilterCounts;
    onFilterChange: (filter: string) => void;
    onClearAll: () => void;
    hasActiveFilters: boolean;
}

const FILTER_CONFIG: FilterConfig[] = [
    { key: 'fileUrl', label: 'With File URL' },
    { key: 'laagBouw', label: 'Laag Bouw' },
    { key: 'HB', label: 'HB' },
    { key: 'duplex', label: 'Duplex' },
    { key: 'appointment', label: 'With Appointment' },
    { key: 'done', label: 'Completed' },
    { key: 'pending', label: 'Pending' },
    { key: 'noappointment', label: 'No Appointment' },
    { key: 'blocked', label: '🚫 Blocked', className: 'blocked-filter' },
    { key: 'all', label: 'All' },
];

const BuildingFilterButtons: React.FC<BuildingFilterButtonsProps> = ({
    currentFilter,
    filterCounts,
    onFilterChange,
    onClearAll,
    hasActiveFilters
}) => {
    return (
        <div className="filterButtons">
            {FILTER_CONFIG.map(({ key, label, className }) => (
                <button
                    key={key}
                    onClick={() => onFilterChange(key)}
                    className={`${currentFilter === key ? 'active' : ''} ${className || ''}`}
                >
                    {label} <span className="filter-count">({filterCounts[key as keyof FilterCounts] || 0})</span>
                </button>
            ))}
            {hasActiveFilters && (
                <button
                    onClick={onClearAll}
                    className="clear-filters"
                    title="Clear all filters and search"
                >
                    ✕ Clear All
                </button>
            )}
        </div>
    );
};

export default React.memo(BuildingFilterButtons);
