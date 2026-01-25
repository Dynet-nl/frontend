/**
 * VirtualizedList Component
 * 
 * A performant list component for rendering large datasets
 * Uses react-window for windowing/virtualization
 */

import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { List } from 'react-window';
import './VirtualizedList.css';

/**
 * Default row renderer component for react-window v2
 */
const DefaultRowComponent = memo(({ index, style, data }) => {
    const { items, renderItem, onItemClick, selectedId } = data;
    const item = items[index];
    
    if (!item) return null;
    
    const isSelected = selectedId && item._id === selectedId;
    
    return (
        <div 
            style={style}
            className={`virtualized-row ${isSelected ? 'virtualized-row--selected' : ''}`}
            onClick={() => onItemClick?.(item)}
        >
            {renderItem ? renderItem(item, index) : (
                <span>{item.name || item.title || `Item ${index + 1}`}</span>
            )}
        </div>
    );
});

DefaultRowComponent.displayName = 'DefaultRowComponent';

/**
 * VirtualizedList Component
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} renderItem - Custom render function for each item
 * @param {number} rowHeight - Height of each row in pixels
 * @param {number} defaultHeight - Total height of the list container
 * @param {Function} onItemClick - Callback when an item is clicked
 * @param {string} selectedId - ID of the currently selected item
 * @param {string} className - Additional CSS class
 * @param {number} overscanCount - Number of items to render outside visible area
 */
const VirtualizedList = ({
    items = [],
    renderItem,
    rowHeight = 60,
    defaultHeight = 400,
    onItemClick,
    selectedId,
    className = '',
    overscanCount = 5,
    emptyMessage = 'No items to display'
}) => {
    const rowProps = {
        items,
        renderItem,
        onItemClick,
        selectedId
    };

    if (items.length === 0) {
        return (
            <div className={`virtualized-list virtualized-list--empty ${className}`}>
                <p className="virtualized-empty-message">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`virtualized-list ${className}`}>
            <List
                defaultHeight={defaultHeight}
                rowCount={items.length}
                rowHeight={rowHeight}
                rowComponent={DefaultRowComponent}
                rowProps={rowProps}
                overscanCount={overscanCount}
            />
        </div>
    );
};

VirtualizedList.propTypes = {
    items: PropTypes.array.isRequired,
    renderItem: PropTypes.func,
    rowHeight: PropTypes.number,
    defaultHeight: PropTypes.number,
    onItemClick: PropTypes.func,
    selectedId: PropTypes.string,
    className: PropTypes.string,
    overscanCount: PropTypes.number,
    emptyMessage: PropTypes.string
};

export default memo(VirtualizedList);
