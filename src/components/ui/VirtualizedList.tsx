/**
 * VirtualizedList Component
 *
 * A performant list component for rendering large datasets
 * Uses react-window for windowing/virtualization
 */

import React, { memo, CSSProperties, ReactNode } from 'react';
import { List } from 'react-window';
import './VirtualizedList.css';

interface ListItem {
    _id?: string;
    name?: string;
    title?: string;
    [key: string]: unknown;
}

interface RowData<T extends ListItem> {
    items: T[];
    renderItem?: (item: T, index: number) => ReactNode;
    onItemClick?: (item: T) => void;
    selectedId?: string;
}

interface RowComponentProps<T extends ListItem> {
    index: number;
    style: CSSProperties;
    data: RowData<T>;
}

/**
 * Default row renderer component for react-window v2
 */
const DefaultRowComponent = memo(<T extends ListItem>({ index, style, data }: RowComponentProps<T>) => {
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
            {renderItem ? renderItem(item, index) : <span>{item.name || item.title || `Item ${index + 1}`}</span>}
        </div>
    );
});

DefaultRowComponent.displayName = 'DefaultRowComponent';

/**
 * VirtualizedList Component Props
 */
interface VirtualizedListProps<T extends ListItem> {
    items: T[];
    renderItem?: (item: T, index: number) => ReactNode;
    rowHeight?: number;
    defaultHeight?: number;
    onItemClick?: (item: T) => void;
    selectedId?: string;
    className?: string;
    overscanCount?: number;
    emptyMessage?: string;
}

/**
 * VirtualizedList Component
 */
function VirtualizedList<T extends ListItem>({
    items = [],
    renderItem,
    rowHeight = 60,
    defaultHeight = 400,
    onItemClick,
    selectedId,
    className = '',
    overscanCount = 5,
    emptyMessage = 'No items to display',
}: VirtualizedListProps<T>): React.ReactElement {
    const rowProps: RowData<T> = {
        items,
        renderItem,
        onItemClick,
        selectedId,
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
                height={defaultHeight}
                itemCount={items.length}
                itemSize={rowHeight}
                itemData={rowProps}
                overscanCount={overscanCount}
                width="100%"
            >
                {({ index, style, data }) => (
                    <DefaultRowComponent index={index} style={style} data={data as RowData<T>} />
                )}
            </List>
        </div>
    );
}

export default memo(VirtualizedList) as typeof VirtualizedList;
