// Cities: one row per city with its counts. Admin adds inline and deletes with a
// cascade-aware confirmation.

import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axiosPrivate from '../api/axios';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../context/NotificationProvider';
import { useError } from '../context/ErrorProvider';
import { usePageChrome } from '../components/shell/ShellContext';
import { ROLES } from '../utils/constants';
import { t } from '../i18n';
import { fmtPercent } from '../utils/format';
import { Button, IconButton, Input, Icon, ProgressBar, EmptyState, ErrorState, SkeletonRows, ConfirmModal } from '../components/ui';

interface CityRow {
    _id: string;
    name: string;
    areas: number;
    districts: number;
    buildings: number;
    flats: number;
    completed: number;
}

interface DeleteCounts {
    name: string;
    areas: number;
    districts: number;
    buildings: number;
    flats: number;
    appointments: number;
}

const CitiesPage: React.FC = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const { showSuccess } = useNotification();
    const { handleApiError } = useError();
    const isAdmin = !!auth.roles?.includes(ROLES.ADMIN);
    usePageChrome([{ label: t('cities.title') }], t('cities.title'));

    const { data: cities, loading, error, reload } = useApi<CityRow[]>('/api/city/stats');
    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);
    const [pending, setPending] = useState<{ city: CityRow; counts: DeleteCounts | null } | null>(null);
    const [confirmName, setConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);

    const totals = (cities ?? []).reduce(
        (acc, c) => ({ areas: acc.areas + c.areas, districts: acc.districts + c.districts, buildings: acc.buildings + c.buildings, flats: acc.flats + c.flats }),
        { areas: 0, districts: 0, buildings: 0, flats: 0 }
    );

    const add = async (e: FormEvent) => {
        e.preventDefault();
        const name = newName.trim();
        if (!name) return;
        setAdding(true);
        try {
            const { data } = await axiosPrivate.post<{ _id: string; name: string }>('/api/city', { name });
            setNewName('');
            showSuccess(`${data.name} toegevoegd`);
            await reload();
        } catch (err) {
            handleApiError(err, 'Stad kon niet worden toegevoegd.');
        } finally {
            setAdding(false);
        }
    };

    const askDelete = async (city: CityRow) => {
        setPending({ city, counts: null });
        setConfirmName('');
        try {
            const { data } = await axiosPrivate.get<DeleteCounts>(`/api/city/${city._id}/counts`);
            setPending({ city, counts: data });
        } catch (err) {
            handleApiError(err, 'Aantallen konden niet worden opgehaald.');
        }
    };

    const doDelete = async () => {
        if (!pending) return;
        setDeleting(true);
        try {
            await axiosPrivate.delete(`/api/city/${pending.city._id}`);
            showSuccess(`${pending.city.name} verwijderd`);
            setPending(null);
            await reload();
        } catch (err) {
            handleApiError(err, 'Stad kon niet worden verwijderd.');
        } finally {
            setDeleting(false);
        }
    };

    const needsTypedName = (pending?.counts?.flats ?? 0) > 100;

    return (
        <div className="page">
            <header className="page__header">
                <div className="page__title-block">
                    <h1 className="t-title-l">{t('cities.title')}</h1>
                    {cities && cities.length > 0 && (
                        <p className="page__subtitle t-small">
                            {cities.length} steden · {totals.areas} gebieden · {totals.districts} districten · {totals.buildings} gebouwen · {totals.flats} flats
                        </p>
                    )}
                </div>
                {isAdmin && (
                    <div className="page__actions">
                        <Button variant="primary" icon="add" onClick={() => document.getElementById('city-add-input')?.focus()}>
                            {t('cities.add')}
                        </Button>
                    </div>
                )}
            </header>

            {loading && !cities ? (
                <SkeletonRows rows={3} />
            ) : error && !cities ? (
                <ErrorState onRetry={reload} />
            ) : (
                <div className="table-wrap">
                    {cities && cities.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('cities.col.city')}</th>
                                    <th className="right">{t('cities.col.areas')}</th>
                                    <th className="right">{t('cities.col.districts')}</th>
                                    <th className="right">{t('cities.col.buildings')}</th>
                                    <th className="right">{t('cities.col.flats')}</th>
                                    <th style={{ width: 200 }}>{t('cities.col.completed')}</th>
                                    {isAdmin && <th aria-label="Acties" />}
                                </tr>
                            </thead>
                            <tbody>
                                {cities.map((c) => {
                                    const pct = c.flats > 0 ? (c.completed / c.flats) * 100 : 0;
                                    return (
                                        <tr key={c._id} className="is-clickable" onClick={() => navigate(`/area/${c._id}`)}>
                                            <td>
                                                <span className="name-cell">
                                                    <Icon name="location_city" />
                                                    <Link to={`/area/${c._id}`} onClick={(e) => e.stopPropagation()}>{c.name}</Link>
                                                    <Icon name="chevron_right" className="chev" />
                                                </span>
                                            </td>
                                            <td className="right mono">{c.areas}</td>
                                            <td className="right mono">{c.districts}</td>
                                            <td className="right mono">{c.buildings}</td>
                                            <td className="right mono">{c.flats}</td>
                                            <td>
                                                <span className="progress-inline">
                                                    <ProgressBar value={pct} />
                                                    <span className="mono">{c.flats > 0 ? fmtPercent(pct, 0) : '—'}</span>
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td>
                                                    <div className="actions" onClick={(e) => e.stopPropagation()}>
                                                        <IconButton icon="delete" label={t('common.delete')} size="dense" onClick={() => askDelete(c)} />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <EmptyState icon="location_city" title={t('cities.empty')} />
                    )}
                    {isAdmin && (
                        <form className="inline-add" onSubmit={add}>
                            <Icon name="add" className="muted" />
                            <Input id="city-add-input" placeholder={t('cities.addPlaceholder')} value={newName} onChange={(e) => setNewName(e.target.value)} disabled={adding} />
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
                title={t('confirm.deleteCity', { name: pending?.city.name ?? '' })}
                confirmText={t('common.delete')}
                loading={deleting}
                confirmDisabled={!pending?.counts || (needsTypedName && confirmName.trim() !== pending?.city.name)}
                message={
                    <div className="col gap-3">
                        {pending?.counts ? (
                            <p>{t('confirm.deleteCityText', { ...pending.counts })}</p>
                        ) : (
                            <p>{t('common.loading')}</p>
                        )}
                        {needsTypedName && (
                            <Input placeholder={t('confirm.typeName')} value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoFocus />
                        )}
                    </div>
                }
            />
        </div>
    );
};

export default CitiesPage;
