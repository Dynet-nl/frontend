// District priority (Admin): drag rows to reorder; #1 is planned first.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import axiosPrivate from '../api/axios';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../context/NotificationProvider';
import { useError } from '../context/ErrorProvider';
import { usePageChrome } from '../components/shell/ShellContext';
import { t } from '../i18n';
import { unwrapList, PaginatedResponse } from '../types/domain';
import { Icon, ProgressBar, ErrorState, SkeletonRows, EmptyState, LinkButton } from '../components/ui';

interface DistrictRow {
    _id: string;
    name: string;
    priority?: number;
    area?: { _id: string; name: string };
    stats?: { totalFlats: number; completedFlats: number; remainingFlats: number; completionPercentage: number };
}

const PriorityPage: React.FC = () => {
    const { showSuccess } = useNotification();
    const { handleApiError } = useError();
    usePageChrome([{ label: t('priority.title') }], t('priority.title'));

    const { data, loading, error, reload } = useApi<PaginatedResponse<DistrictRow> | DistrictRow[]>('/api/district/all', { params: { limit: 200, sortBy: 'priority', sortOrder: 'asc' } });
    const loaded = useMemo(() => unwrapList<DistrictRow>(data ?? undefined), [data]);
    const [rows, setRows] = useState<DistrictRow[]>([]);
    const [saving, setSaving] = useState(false);
    useEffect(() => { setRows(loaded); }, [loaded]);

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination || result.destination.index === result.source.index) return;
        const next = [...rows];
        const [moved] = next.splice(result.source.index, 1);
        next.splice(result.destination.index, 0, moved);
        const renumbered = next.map((d, i) => ({ ...d, priority: i + 1 }));
        setRows(renumbered);
        setSaving(true);
        try {
            await axiosPrivate.post('/api/district/reorder', { districts: renumbered.map((d) => ({ id: d._id, priority: d.priority })) });
            showSuccess(t('priority.saved', { name: moved.name, n: result.destination.index + 1 }));
        } catch (err) {
            handleApiError(err, 'Prioriteit kon niet worden opgeslagen.');
            setRows(loaded);
        } finally {
            setSaving(false);
        }
    };

    if (loading && !data) return <SkeletonRows rows={6} />;
    if (error && !data) return <ErrorState onRetry={reload} />;

    return (
        <div className="page">
            <header className="page__header">
                <div className="page__title-block">
                    <h1 className="t-title-l">{t('priority.title')}</h1>
                    <p className="page__subtitle t-small">{t('priority.subtitle')}</p>
                </div>
                <div className="page__actions">
                    {saving && <span className="t-caption muted">Opslaan…</span>}
                    <LinkButton to="/district-management" variant="secondary" icon="upload_file">{t('nav.districtImport')}</LinkButton>
                </div>
            </header>

            {rows.length === 0 ? (
                <EmptyState icon="low_priority" title="Nog geen districten" text={t('district.emptyText')} />
            ) : (
                <div className="table-wrap">
                    <div className="prio-row prio-row--head">
                        <span />
                        <span>{t('priority.col.rank')}</span>
                        <span>{t('priority.col.district')}</span>
                        <span className="hide-narrow">{t('priority.col.area')}</span>
                        <span className="right hide-narrow">{t('priority.col.flats')}</span>
                        <span className="right hide-narrow">{t('priority.col.done')}</span>
                        <span className="right">{t('priority.col.rest')}</span>
                        <span>{t('priority.col.progress')}</span>
                    </div>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="priority">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps}>
                                    {rows.map((d, index) => (
                                        <Draggable key={d._id} draggableId={d._id} index={index}>
                                            {(drag, snapshot) => (
                                                <div ref={drag.innerRef} {...drag.draggableProps} className={`prio-row ${snapshot.isDragging ? 'is-dragging' : ''}`.trim()} style={drag.draggableProps.style}>
                                                    <span className="handle" {...drag.dragHandleProps} aria-label="Sleep om te verplaatsen"><Icon name="drag_indicator" /></span>
                                                    <span className="rank">#{d.priority || index + 1}</span>
                                                    <span style={{ fontWeight: 600 }}>
                                                        <Link to={d.area ? `/district/${d.area._id}?district=${d._id}` : '/districts'} style={{ color: 'inherit' }}>{d.name}</Link>
                                                    </span>
                                                    <span className="secondary hide-narrow">{d.area?.name ?? '—'}</span>
                                                    <span className="right mono hide-narrow">{d.stats?.totalFlats ?? 0}</span>
                                                    <span className="right mono hide-narrow">{d.stats?.completedFlats ?? 0}</span>
                                                    <span className="right mono">{d.stats?.remainingFlats ?? 0}</span>
                                                    <span className="progress-inline">
                                                        <ProgressBar value={d.stats?.completionPercentage ?? 0} size="sm" />
                                                        <span className="mono">{d.stats?.completionPercentage ?? 0}%</span>
                                                    </span>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            )}
        </div>
    );
};

export default PriorityPage;
