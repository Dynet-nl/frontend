// Areas of one city, with the district priority order visible without opening the area.

import React, { useState, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axiosPrivate from '../api/axios';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../context/NotificationProvider';
import { useError } from '../context/ErrorProvider';
import { usePageChrome } from '../components/shell/ShellContext';
import { ROLES } from '../utils/constants';
import { t } from '../i18n';
import { fmtPercent } from '../utils/format';
import { Button, IconButton, Input, Icon, ProgressBar, EmptyState, ErrorState, SkeletonRows, ConfirmModal, LinkButton } from '../components/ui';

interface AreaRow {
    _id: string;
    name: string;
    districts: number;
    buildings: number;
    flats: number;
    completed: number;
    districtList: Array<{ _id: string; name: string; priority?: number }>;
}

interface AreaStats {
    city: { _id: string; name: string };
    areas: AreaRow[];
}

interface DeleteCounts {
    districts: number;
    buildings: number;
    flats: number;
    appointments: number;
}

const AreasPage: React.FC = () => {
    const { cityId } = useParams<{ cityId: string }>();
    const { auth } = useAuth();
    const navigate = useNavigate();
    const { showSuccess } = useNotification();
    const { handleApiError } = useError();
    const isAdmin = !!auth.roles?.includes(ROLES.ADMIN);

    const { data, loading, error, reload } = useApi<AreaStats>(cityId ? `/api/area/stats/${cityId}` : null);
    const cityName = data?.city.name ?? '';
    usePageChrome([{ label: t('cities.title'), path: '/city' }, { label: cityName || '…' }], cityName ? t('areas.title', { city: cityName }) : undefined);

    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);
    const [pending, setPending] = useState<{ area: AreaRow; counts: DeleteCounts | null } | null>(null);
    const [confirmName, setConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);

    const areas = data?.areas ?? [];
    const totals = areas.reduce(
        (acc, a) => ({ districts: acc.districts + a.districts, buildings: acc.buildings + a.buildings, flats: acc.flats + a.flats }),
        { districts: 0, buildings: 0, flats: 0 }
    );

    const add = async (e: FormEvent) => {
        e.preventDefault();
        const name = newName.trim();
        if (!name || !cityId) return;
        setAdding(true);
        try {
            await axiosPrivate.post(`/api/area/${cityId}`, { name });
            setNewName('');
            showSuccess(`${name} toegevoegd`);
            await reload();
        } catch (err) {
            handleApiError(err, 'Gebied kon niet worden toegevoegd.');
        } finally {
            setAdding(false);
        }
    };

    const askDelete = async (area: AreaRow) => {
        setPending({ area, counts: null });
        setConfirmName('');
        try {
            const res = await axiosPrivate.get<DeleteCounts>(`/api/area/${area._id}/counts`);
            setPending({ area, counts: res.data });
        } catch (err) {
            handleApiError(err, 'Aantallen konden niet worden opgehaald.');
        }
    };

    const doDelete = async () => {
        if (!pending) return;
        setDeleting(true);
        try {
            await axiosPrivate.delete(`/api/area/${pending.area._id}`);
            showSuccess(`${pending.area.name} verwijderd`);
            setPending(null);
            await reload();
        } catch (err) {
            handleApiError(err, 'Gebied kon niet worden verwijderd.');
        } finally {
            setDeleting(false);
        }
    };

    const needsTypedName = (pending?.counts?.flats ?? 0) > 100;

    return (
        <div className="page">
            <header className="page__header">
                <div className="page__title-block">
                    <h1 className="t-title-l">{cityName ? t('areas.title', { city: cityName }) : 'Gebieden'}</h1>
                    {areas.length > 0 && (
                        <p className="page__subtitle t-small">
                            {areas.length} gebieden · {totals.districts} districten · {totals.buildings} gebouwen · {totals.flats} flats
                        </p>
                    )}
                </div>
                {isAdmin && (
                    <div className="page__actions">
                        <Button variant="primary" icon="add" onClick={() => document.getElementById('area-add-input')?.focus()}>
                            {t('areas.add')}
                        </Button>
                    </div>
                )}
            </header>

            {loading && !data ? (
                <SkeletonRows rows={3} />
            ) : error && !data ? (
                <ErrorState onRetry={reload} />
            ) : (
                <div className="table-wrap">
                    {areas.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('areas.col.area')}</th>
                                    <th>{t('areas.col.districtsByPriority')}</th>
                                    <th className="right">{t('cities.col.buildings')}</th>
                                    <th className="right">{t('cities.col.flats')}</th>
                                    <th style={{ width: 200 }}>{t('cities.col.completed')}</th>
                                    <th aria-label="Acties" />
                                </tr>
                            </thead>
                            <tbody>
                                {areas.map((a) => {
                                    const pct = a.flats > 0 ? (a.completed / a.flats) * 100 : 0;
                                    return (
                                        <tr key={a._id} className="is-clickable" onClick={() => navigate(`/district/${a._id}`)}>
                                            <td>
                                                <span className="name-cell">
                                                    <Icon name="map" />
                                                    <Link to={`/district/${a._id}`} onClick={(e) => e.stopPropagation()}>{a.name}</Link>
                                                    <Icon name="chevron_right" className="chev" />
                                                </span>
                                            </td>
                                            <td>
                                                {a.districtList.length > 0 ? (
                                                    <span className="rank-chips">
                                                        {a.districtList.slice(0, 6).map((d, i) => (
                                                            <Link key={d._id} to={`/district/${a._id}?district=${d._id}`} className="rank-chip" onClick={(e) => e.stopPropagation()}>
                                                                <span className="rank">#{d.priority || i + 1}</span>
                                                                {d.name}
                                                            </Link>
                                                        ))}
                                                        {a.districtList.length > 6 && <span className="rank-chip">+{a.districtList.length - 6}</span>}
                                                    </span>
                                                ) : (
                                                    <span className="t-caption muted">{t('areas.noDistricts')}</span>
                                                )}
                                            </td>
                                            <td className="right mono">{a.buildings}</td>
                                            <td className="right mono">{a.flats}</td>
                                            <td>
                                                <span className="progress-inline">
                                                    <ProgressBar value={pct} />
                                                    <span className="mono">{a.flats > 0 ? fmtPercent(pct, 0) : '—'}</span>
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions" onClick={(e) => e.stopPropagation()}>
                                                    {isAdmin && <LinkButton to={`/district-management/${a._id}`} variant="ghost" size="dense" icon="upload_file" title={t('nav.districtImport')} />}
                                                    {isAdmin && <IconButton icon="delete" label={t('common.delete')} size="dense" onClick={() => askDelete(a)} />}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <EmptyState icon="map" title={t('areas.empty')} />
                    )}
                    {isAdmin && (
                        <form className="inline-add" onSubmit={add}>
                            <Icon name="add" className="muted" />
                            <Input id="area-add-input" placeholder={t('areas.addPlaceholder')} value={newName} onChange={(e) => setNewName(e.target.value)} disabled={adding} />
                            <Button type="submit" variant="secondary" loading={adding} disabled={!newName.trim()}>
                                {t('common.add')}
                            </Button>
                        </form>
                    )}
                </div>
            )}

            <ConfirmModal
                open={!!pending}
                onClose={() => setPending(null)}
                onConfirm={doDelete}
                title={t('confirm.deleteArea', { name: pending?.area.name ?? '' })}
                confirmText={t('common.delete')}
                loading={deleting}
                confirmDisabled={!pending?.counts || (needsTypedName && confirmName.trim() !== pending?.area.name)}
                message={
                    <div className="col gap-3">
                        {pending?.counts ? <p>{t('confirm.deleteAreaText', { ...pending.counts })}</p> : <p>{t('common.loading')}</p>}
                        {needsTypedName && <Input placeholder={t('confirm.typeName')} value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoFocus />}
                    </div>
                }
            />
        </div>
    );
};

export default AreasPage;
