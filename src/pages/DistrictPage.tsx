// The working screen: districts of an area in the sidebar, buildings of the selected
// district in a table (default on desktop) or as cards. Filters carry counts, block/unblock
// lives on the row, the last viewed district per area is remembered.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axiosPrivate from '../api/axios';
import { useApi } from '../hooks/useApi';
import { usePersistedState } from '../hooks/usePersistedState';
import { useIsPhone } from '../hooks/useMediaQuery';
import { useNotification } from '../context/NotificationProvider';
import { useError } from '../context/ErrorProvider';
import { usePageChrome, SidebarSection, TopbarActions } from '../components/shell/ShellContext';
import { rememberArea } from '../components/shell/AppShell';
import DistrictSwitcher from '../components/district/DistrictSwitcher';
import BuildingTable from '../components/district/BuildingTable';
import BuildingCards from '../components/district/BuildingCards';
import { ROLES } from '../utils/constants';
import { t } from '../i18n';
import { fmtPercent } from '../utils/format';
import { summarize, matchesFilter, matchesQuery, FILTERS, BuildingFilter, BuildingSummary } from '../utils/buildingSummary';
import type { Building, District, PaginatedResponse } from '../types/domain';
import { unwrapList } from '../types/domain';
import { Button, LinkButton, Input, Chip, Segmented, Pill, ProgressBar, EmptyState, ErrorState, SkeletonRows, Pagination, ConfirmModal, Modal, Field, Textarea, Icon } from '../components/ui';
import type { StringKey } from '../i18n';

interface DistrictsResponse extends PaginatedResponse<District> {
    area?: { _id: string; name: string; city?: string } | null;
}

interface DistrictDetail {
    _id: string;
    name: string;
    priority?: number;
    area?: { _id: string; name: string };
    buildings?: Building[];
}

const PAGE_SIZE = 20;
const districtKey = (areaId: string) => `dynet.district.${areaId}`;

const DistrictPage: React.FC = () => {
    const { areaId = '' } = useParams<{ areaId: string }>();
    const [search, setSearch] = useSearchParams();
    const { auth } = useAuth();
    const roles = useMemo(() => auth.roles ?? [], [auth.roles]);
    const isAdmin = roles.includes(ROLES.ADMIN);
    const isPhone = useIsPhone();
    const { showSuccess } = useNotification();
    const { handleApiError } = useError();

    // Districts of the area (sidebar).
    const { data: districtsData, loading: loadingDistricts, error: districtsError, reload: reloadDistricts, setData: setDistrictsData } = useApi<DistrictsResponse>(
        areaId ? `/api/district/area/${areaId}` : null,
        { params: { limit: 100, sortBy: 'priority', sortOrder: 'asc' } }
    );
    const districts = useMemo(() => unwrapList<District>(districtsData ?? undefined), [districtsData]);
    const areaName = districtsData?.area?.name ?? '';
    const cityId = districtsData?.area?.city;

    // Selected district: URL > remembered > first by priority.
    const requested = search.get('district');
    const currentId = useMemo(() => {
        if (districts.length === 0) return null;
        if (requested && districts.some((d) => d._id === requested)) return requested;
        let saved: string | null = null;
        try { saved = localStorage.getItem(districtKey(areaId)); } catch { /* ignore */ }
        if (saved && districts.some((d) => d._id === saved)) return saved;
        return districts[0]._id;
    }, [districts, requested, areaId]);

    useEffect(() => {
        if (areaId) rememberArea(areaId);
    }, [areaId]);
    useEffect(() => {
        if (currentId) {
            try { localStorage.setItem(districtKey(areaId), currentId); } catch { /* ignore */ }
        }
    }, [currentId, areaId]);

    // View state.
    const [mode, setMode] = usePersistedState<'table' | 'cards'>('dynet.districtMode', 'table');
    const [filter, setFilter] = useState<BuildingFilter>('all');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const effectiveMode = isPhone ? 'cards' : mode;

    const selectDistrict = useCallback((id: string) => {
        setSearch({ district: id }, { replace: true });
        setPage(1);
    }, [setSearch]);

    // Buildings of the selected district.
    const { data: detail, loading: loadingDetail, error: detailError, reload: reloadDetail, setData: setDetail } = useApi<DistrictDetail>(
        currentId ? `/api/district/${currentId}` : null
    );
    const current = districts.find((d) => d._id === currentId) ?? null;

    usePageChrome(
        [
            { label: t('cities.title'), path: '/city' },
            ...(cityId ? [{ label: areaName || '…', path: `/area/${cityId}` }] : [{ label: areaName || '…' }]),
            ...(current ? [{ label: current.name }] : []),
        ],
        current?.name
    );

    const summaries = useMemo(() => (detail?.buildings ?? []).map(summarize), [detail]);
    const counts = useMemo(() => {
        const c = {} as Record<BuildingFilter, number>;
        for (const f of FILTERS) c[f.key] = summaries.filter((s) => matchesFilter(s, f.key)).length;
        return c;
    }, [summaries]);
    const visible = useMemo(() => summaries.filter((s) => matchesFilter(s, filter) && matchesQuery(s, query)), [summaries, filter, query]);
    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const pageRows = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    useEffect(() => { setPage(1); }, [filter, query, currentId]);

    const totals = useMemo(() => {
        const flats = summaries.reduce((n, s) => n + s.total, 0);
        const completed = summaries.reduce((n, s) => n + s.completed, 0);
        const scheduled = summaries.reduce((n, s) => n + s.scheduled, 0);
        const blocked = summaries.filter((s) => s.building.isBlocked).length;
        return { flats, completed, scheduled, blocked, pct: flats > 0 ? (completed / flats) * 100 : 0 };
    }, [summaries]);

    // Reorder (Admin).
    const onReorder = useCallback(async (ordered: District[]) => {
        setDistrictsData((prev) => (prev ? { ...prev, data: ordered.map((d, i) => ({ ...d, priority: i + 1 })) } : prev));
        try {
            await axiosPrivate.post('/api/district/reorder', { districts: ordered.map((d, i) => ({ id: d._id, priority: i + 1 })) });
            showSuccess('Prioriteit opgeslagen');
        } catch (err) {
            handleApiError(err, 'Prioriteit kon niet worden opgeslagen.');
        } finally {
            await reloadDistricts();
        }
    }, [setDistrictsData, showSuccess, handleApiError, reloadDistricts]);

    // Block / unblock.
    const [blockTarget, setBlockTarget] = useState<BuildingSummary | null>(null);
    const [blockReason, setBlockReason] = useState('');
    const [unblockTarget, setUnblockTarget] = useState<BuildingSummary | null>(null);
    const [busy, setBusy] = useState(false);

    const patchBuilding = (id: string, patch: Partial<Building>) =>
        setDetail((prev) => (prev ? { ...prev, buildings: (prev.buildings ?? []).map((b) => (b._id === id ? { ...b, ...patch } : b)) } : prev));

    const confirmBlock = async () => {
        if (!blockTarget || !blockReason.trim()) return;
        setBusy(true);
        try {
            await axiosPrivate.put(`/api/building/block/${blockTarget.building._id}`, { reason: blockReason.trim() });
            patchBuilding(blockTarget.building._id, { isBlocked: true, blockReason: blockReason.trim() });
            showSuccess(`${blockTarget.building.address} geblokkeerd`);
            setBlockTarget(null);
            setBlockReason('');
        } catch (err) {
            handleApiError(err, 'Blokkeren is niet gelukt.');
        } finally {
            setBusy(false);
        }
    };
    const confirmUnblock = async () => {
        if (!unblockTarget) return;
        setBusy(true);
        try {
            await axiosPrivate.put(`/api/building/unblock/${unblockTarget.building._id}`, {});
            patchBuilding(unblockTarget.building._id, { isBlocked: false, blockReason: undefined });
            showSuccess(`${unblockTarget.building.address} gedeblokkeerd`);
            setUnblockTarget(null);
        } catch (err) {
            handleApiError(err, 'Deblokkeren is niet gelukt.');
        } finally {
            setBusy(false);
        }
    };

    const sidebar = useMemo(
        () => (
            <DistrictSwitcher areaName={areaName} districts={districts} currentId={currentId} canReorder={isAdmin} onSelect={selectDistrict} onReorder={onReorder} />
        ),
        [areaName, districts, currentId, isAdmin, selectDistrict, onReorder]
    );

    const topbarActions = useMemo(
        () => (isAdmin ? <LinkButton to={`/district-management/${areaId}`} variant="secondary" size="dense" icon="upload_file">{t('district.manage')}</LinkButton> : null),
        [isAdmin, areaId]
    );

    if (districtsError && !districtsData) {
        return <ErrorState onRetry={reloadDistricts} />;
    }

    return (
        <div className="page">
            {districts.length > 0 && <SidebarSection>{sidebar}</SidebarSection>}
            {topbarActions && <TopbarActions>{topbarActions}</TopbarActions>}

            {loadingDistricts && !districtsData ? (
                <SkeletonRows rows={5} />
            ) : districts.length === 0 ? (
                <EmptyState
                    icon="grid_view"
                    title={t('district.noDistricts')}
                    text={t('district.emptyText')}
                    action={isAdmin ? <LinkButton to={`/district-management/${areaId}`} variant="primary" icon="upload_file">{t('home.importDistrict')}</LinkButton> : undefined}
                />
            ) : (
                <>
                    <header className="page__header">
                        <div className="page__title-block">
                            <div className="page__title">
                                <h1 className="t-title-l">{current?.name ?? '…'}</h1>
                                {current?.priority ? <Pill family="accent" size="md">{t('district.priority', { n: current.priority })}</Pill> : null}
                            </div>
                            {detail && (
                                <p className="page__subtitle t-small">
                                    {summaries.length} gebouwen · {totals.flats} flats · {totals.completed} opgeleverd ({fmtPercent(totals.pct)})
                                    {totals.blocked > 0 && <> · <span style={{ color: 'var(--status-blocked-fg)' }}>{totals.blocked} geblokkeerd</span></>}
                                </p>
                            )}
                        </div>
                        <div className="page__actions">
                            {!isPhone && (
                                <Segmented
                                    value={mode}
                                    onChange={setMode}
                                    aria-label="Weergave"
                                    options={[
                                        { value: 'table', label: t('district.table'), icon: 'table_rows' },
                                        { value: 'cards', label: t('district.cards'), icon: 'grid_view' },
                                    ]}
                                />
                            )}
                            {isPhone && districts.length > 1 && (
                                <select className="select" value={currentId ?? ''} onChange={(e) => selectDistrict(e.target.value)} aria-label={t('nav.districts')}>
                                    {districts.map((d, i) => <option key={d._id} value={d._id}>#{d.priority || i + 1} {d.name}</option>)}
                                </select>
                            )}
                        </div>
                    </header>

                    <div className="district__toolbar">
                        <div className="district__search">
                            <Input icon="search" placeholder={t('district.searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
                        </div>
                        <div className={`chips ${isPhone ? 'chips--scroll' : ''}`.trim()}>
                            {FILTERS.filter((f) => f.key === 'all' || counts[f.key] > 0 || f.key === filter).map((f) => (
                                <Chip key={f.key} active={filter === f.key} count={counts[f.key]} danger={f.danger} onClick={() => setFilter(f.key)}>
                                    {t(f.labelKey as StringKey)}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    {detail && summaries.length > 0 && (
                        <div className="district__progress">
                            <span>{t('district.completedIn')}</span>
                            <ProgressBar value={totals.pct} />
                            <span className="mono">{totals.completed} / {totals.flats} · {fmtPercent(totals.pct)}</span>
                            <span className="hide-mobile">{t('district.scheduledSummary', { scheduled: totals.scheduled, none: totals.flats - totals.scheduled })}</span>
                        </div>
                    )}

                    {loadingDetail && !detail ? (
                        <SkeletonRows rows={6} />
                    ) : detailError && !detail ? (
                        <ErrorState onRetry={reloadDetail} />
                    ) : summaries.length === 0 ? (
                        <EmptyState
                            icon="apartment"
                            title={t('district.empty')}
                            text={t('district.emptyText')}
                            action={isAdmin ? <LinkButton to={`/district-management/${areaId}`} variant="primary" icon="upload_file">{t('home.importDistrict')}</LinkButton> : undefined}
                        />
                    ) : visible.length === 0 ? (
                        <EmptyState icon="filter_list_off" title="Geen gebouwen voor dit filter" action={<Button variant="secondary" onClick={() => { setFilter('all'); setQuery(''); }}>{t('common.clear')}</Button>} />
                    ) : effectiveMode === 'table' ? (
                        <div className="table-wrap table-wrap--scroll">
                            <BuildingTable rows={pageRows} roles={roles} onBlock={(s) => { setBlockTarget(s); setBlockReason(''); }} onUnblock={setUnblockTarget} />
                            <div className="table__footer">
                                <span>{t('district.flatsOf', { n: visible.length, total: summaries.length })}</span>
                                <span className="ml-auto"><Pagination page={page} totalPages={totalPages} onChange={setPage} /></span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <BuildingCards rows={pageRows} roles={roles} onBlock={(s) => { setBlockTarget(s); setBlockReason(''); }} onUnblock={setUnblockTarget} />
                            <div className="row row--between">
                                <span className="t-caption secondary">{t('district.flatsOf', { n: visible.length, total: summaries.length })}</span>
                                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                            </div>
                        </>
                    )}
                </>
            )}

            <Modal
                open={!!blockTarget}
                onClose={() => setBlockTarget(null)}
                title={t('district.blockReasonTitle')}
                subtitle={blockTarget?.building.address}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setBlockTarget(null)} disabled={busy}>{t('common.cancel')}</Button>
                        <Button variant="danger" icon="block" onClick={confirmBlock} loading={busy} disabled={!blockReason.trim()}>{t('common.block')}</Button>
                    </>
                }
            >
                <Field label={t('district.blockReasonLabel')} required>
                    {(id) => <Textarea id={id} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder={t('district.blockReasonPlaceholder')} maxLength={500} />}
                </Field>
                <p className="t-caption muted">Geblokkeerde gebouwen kunnen niet worden ingepland totdat de blokkade is opgeheven.</p>
            </Modal>

            <ConfirmModal
                open={!!unblockTarget}
                onClose={() => setUnblockTarget(null)}
                onConfirm={confirmUnblock}
                title={t('district.unblockTitle')}
                confirmText={t('common.unblock')}
                variant="primary"
                loading={busy}
                message={t('district.unblockText', { address: unblockTarget?.building.address ?? '', reason: unblockTarget?.building.blockReason ?? '—' })}
            />

            {isAdmin && detail && summaries.length > 0 && (
                <p className="t-caption muted row">
                    <Icon name="info" size="dense" />
                    <span>Gebouw openen = plattegrond & kabels. <Link to={`/district-management/${areaId}`}>Districtbeheer</Link> voor het weekbestand.</span>
                </p>
            )}
        </div>
    );
};

export default DistrictPage;
