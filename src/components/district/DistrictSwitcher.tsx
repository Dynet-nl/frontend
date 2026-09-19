// District list in the sidebar: click to switch, Admin drags to change priority.

import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';
import Icon from '../ui/Icon';
import { t } from '../../i18n';
import type { District } from '../../types/domain';

interface DistrictSwitcherProps {
    areaName: string;
    districts: District[];
    currentId: string | null;
    canReorder: boolean;
    onSelect: (id: string) => void;
    onReorder: (ordered: District[]) => void;
}

const DistrictSwitcher: React.FC<DistrictSwitcherProps> = ({ areaName, districts, currentId, canReorder, onSelect, onReorder }) => {
    const onDragEnd = (result: DropResult) => {
        if (!result.destination || result.destination.index === result.source.index) return;
        const next = [...districts];
        const [moved] = next.splice(result.source.index, 1);
        next.splice(result.destination.index, 0, moved);
        onReorder(next);
    };

    const item = (d: District, index: number, handleProps?: DraggableProvidedDragHandleProps | null) => (
        <button
            type="button"
            className={`sidebar__subitem ${d._id === currentId ? 'is-active' : ''}`.trim()}
            onClick={() => onSelect(d._id)}
            aria-current={d._id === currentId ? 'true' : undefined}
            title={d.name}
        >
            {canReorder && (
                <span className="muted" style={{ display: 'inline-flex', cursor: 'grab' }} {...handleProps}>
                    <Icon name="drag_indicator" size="dense" />
                </span>
            )}
            <span className="truncate grow">{d.name}</span>
            <span className="rank mono muted">#{d.priority || index + 1}</span>
        </button>
    );

    return (
        <div className="sidebar__group">
            <div className="t-overline sidebar__group-title truncate">{t('nav.districts')} · {areaName}</div>
            {canReorder ? (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="districts">
                        {(provided) => (
                            <div className="sidebar__sub" ref={provided.innerRef} {...provided.droppableProps}>
                                {districts.map((d, index) => (
                                    <Draggable key={d._id} draggableId={d._id} index={index}>
                                        {(drag, snapshot) => (
                                            <div ref={drag.innerRef} {...drag.draggableProps} style={{ ...drag.draggableProps.style, opacity: snapshot.isDragging ? 0.9 : 1 }}>
                                                {item(d, index, drag.dragHandleProps)}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            ) : (
                <div className="sidebar__sub">{districts.map((d, i) => <React.Fragment key={d._id}>{item(d, i)}</React.Fragment>)}</div>
            )}
            {canReorder && <div className="sidebar__hint">{t('district.dragHint')}</div>}
        </div>
    );
};

export default DistrictSwitcher;
