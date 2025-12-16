// Filter buttons component for filtering buildings by various criteria

import React from 'react';

const FILTER_CONFIG = [
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

const BuildingFilterButtons = ({ 
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
                    {label} <span className="filter-count">({filterCounts[key] || 0})</span>
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
