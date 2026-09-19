// District import (Admin): pick an area, drop the weekly Excel, read the checks and the
// change preview, then import. Update mode shows which existing flats would change.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import axiosPrivate from '../api/axios';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../context/NotificationProvider';
import { useError } from '../context/ErrorProvider';
import { usePageChrome } from '../components/shell/ShellContext';
import ImportProgressDialog, { ProgressData } from '../components/import/ImportProgressDialog';
import { t } from '../i18n';
import logger from '../utils/logger';
import { fmtDateTime } from '../utils/format';
import { unwrapList, PaginatedResponse, District } from '../types/domain';
import { Button, Segmented, Panel, Field, Input, Select, Icon, KeyChip, ErrorState, SkeletonRows, EmptyState } from '../components/ui';

interface Preview {
    stats?: { totalRows?: number; totalBuildings?: number; totalFlats?: number; validRows?: number; buildingsWithMultipleFlats?: number };
    preview?: Record<string, unknown>[];
    buildingPreview?: Array<{ keyName: string; address: string; houseNumber: string; flats: number }>;
    validation?: { warnings?: string[]; errors?: string[]; stats?: { totalRows?: number; validRows?: number; emptyRows?: number; columnsCount?: number } };
}

interface Conflict {
    address: string;
    zoeksleutel?: string;
    changedFields: string[];
    conflictReason?: string;
}

interface HistoryItem {
    _id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
    area?: { name?: string };
    stats?: { buildings?: number; flats?: number };
}

interface AreaOption {
    _id: string;
    name: string;
    city?: string | { _id: string; name: string };
}

const MAX_BYTES = 50 * 1024 * 1024;
const OK_TYPES = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
const OK_EXT = /\.(xlsx|xls|csv)$/i;

const FIELD_LABELS: Record<string, string> = { fcStatusHas: 'Opleverstatus', team: 'Ploeg', odfPositie: 'ODF-positie', odf: 'ODF', complexNaam: 'Complexnaam', postcode: 'Postcode', adres: 'Adres', soortBouw: 'Soort bouw', ipVezelwaarde: 'IP vezelwaarde', ap: 'AP', dp: 'DP', laswerkAP: 'Laswerk AP', laswerkDP: 'Laswerk DP', tkNummer: 'TK-nummer', toelichtingStatus: 'Toelichting', email: 'E-mail' };

const ImportPage: React.FC = () => {
    const { areaId: routeAreaId } = useParams<{ areaId: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    const { handleApiError } = useError();
    usePageChrome([{ label: t('import.title') }], t('import.title'));

    const { data: areasData, loading: la, error: ea, reload: ra } = useApi<PaginatedResponse<AreaOption> | AreaOption[]>('/api/area');
    const areas = useMemo(() => unwrapList<AreaOption>(areasData ?? undefined), [areasData]);
    const areaId = routeAreaId ?? '';
    const area = areas.find((a) => a._id === areaId);

    const { data: districtsData, reload: rd } = useApi<PaginatedResponse<District>>(areaId ? `/api/district/area/${areaId}` : null, { params: { limit: 100 } });
    const districts = useMemo(() => unwrapList<District>(districtsData ?? undefined), [districtsData]);
    const { data: history, reload: rh } = useApi<{ history: HistoryItem[] }>(areaId ? `/api/district/import-history/${areaId}` : null);

    const [mode, setMode] = useState<'create' | 'update'>('create');
    const [districtName, setDistrictName] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileErrors, setFileErrors] = useState<string[]>([]);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
    const [starting, setStarting] = useState(false);
    const [importId, setImportId] = useState<string | null>(null);
    const [over, setOver] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => { if (districts.length > 0 && !districtId) setDistrictId(districts[0]._id); }, [districts, districtId]);

    const reset = useCallback(() => {
        setFile(null); setFileErrors([]); setPreview(null); setConflicts(null); setDistrictName('');
    }, []);

    const checkConflicts = useCallback(async (p: Preview) => {
        try {
            const { data } = await axiosPrivate.post<{ conflicts: Conflict[] }>('/api/district/check-conflicts', { flats: p.preview ?? [], areaId });
            setConflicts(data.conflicts ?? []);
        } catch (err) {
            logger.error('Conflict check failed', err);
            setConflicts([]);
        }
    }, [areaId]);

    const pick = async (f: File | null) => {
        setPreview(null); setConflicts(null);
        if (!f) { setFile(null); setFileErrors([]); return; }
        const errors: string[] = [];
        if (f.size > MAX_BYTES) errors.push('Bestand is groter dan 50 MB.');
        if (!OK_TYPES.includes(f.type) && !OK_EXT.test(f.name)) errors.push('Alleen Excel (.xlsx, .xls) of CSV.');
        setFile(f);
        setFileErrors(errors);
        if (errors.length > 0) return;
        setPreviewing(true);
        try {
            const fd = new FormData();
            fd.append('file', f);
            fd.append('areaId', areaId);
            const { data } = await axiosPrivate.post<Preview>('/api/district/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setPreview(data);
            if (mode === 'update') await checkConflicts(data);
        } catch (err) {
            const ax = err as AxiosError<{ message?: string; errors?: string[] }>;
            setFileErrors(ax.response?.data?.errors?.length ? ax.response.data.errors : [ax.response?.data?.message || 'Bestand kon niet worden gelezen.']);
        } finally {
            setPreviewing(false);
        }
    };

    useEffect(() => {
        if (mode === 'update' && preview && conflicts === null) checkConflicts(preview);
    }, [mode, preview, conflicts, checkConflicts]);

    const start = async () => {
        if (!file || fileErrors.length > 0 || !preview) return;
        if (mode === 'create' && !districtName.trim()) { showError('Geef het nieuwe district een naam.'); return; }
        if (mode === 'update' && !districtId) { showError('Kies het district dat bijgewerkt moet worden.'); return; }
        setStarting(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('areaId', areaId);
            fd.append('operationType', mode);
            if (mode === 'create') fd.append('currentDistrict', districtName.trim());
            else {
                fd.append('districtId', districtId);
                const d = districts.find((x) => x._id === districtId);
                if (d) fd.append('currentDistrict', d.name);
            }
            const { data } = await axiosPrivate.post<{ importId: string }>('/api/district/import-enhanced', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setImportId(data.importId);
        } catch (err) {
            const ax = err as AxiosError<{ error?: string; errors?: string[]; message?: string }>;
            const details = ax.response?.data?.errors?.join(' ') || ax.response?.data?.error || ax.response?.data?.message;
            if (details) showError(`Import kon niet starten: ${details}`);
            else handleApiError(err, 'Import kon niet starten.');
        } finally {
            setStarting(false);
        }
    };

    const onComplete = useCallback((data: ProgressData) => {
        setImportId(null);
        reset();
        rh(); rd();
        const s = data.stats || {};
        showSuccess(`${t('import.done')} · ${s.newFlats ?? 0} nieuw, ${s.updatedFlats ?? 0} gewijzigd, ${s.newBuildings ?? 0} nieuwe gebouwen`);
    }, [reset, rh, rd, showSuccess]);
    const onFail = useCallback((msg: string) => { setImportId(null); showError(`${t('import.failed')}: ${msg}`); }, [showError]);
    const onCancel = useCallback(() => { setImportId(null); rh(); }, [rh]);

    if (la && !areasData) return <SkeletonRows rows={4} />;
    if (ea && !areasData) return <ErrorState onRetry={ra} />;

    // No area chosen yet: pick one.
    if (!areaId || !area) {
        return (
            <div className="page">
                <header className="page__header">
                    <div className="page__title-block">
                        <h1 className="t-title-l">{t('import.title')}</h1>
                        <p className="page__subtitle t-small">Kies het gebied waarin je een district wilt aanmaken of bijwerken.</p>
                    </div>
                </header>
                {areas.length === 0 ? (
                    <EmptyState icon="map" title="Nog geen gebieden" text="Maak eerst een stad en een gebied aan." action={<Button variant="primary" onClick={() => navigate('/city')}>{t('nav.cities')}</Button>} />
                ) : (
                    <div className="grid grid--auto">
                        {areas.map((a) => (
                            <button key={a._id} type="button" className="panel" style={{ textAlign: 'left', padding: 16, display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => navigate(`/district-management/${a._id}`)}>
                                <Icon name="map" className="muted" />
                                <span className="col grow" style={{ minWidth: 0 }}>
                                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                                    <span className="t-caption secondary">{typeof a.city === 'object' && a.city ? a.city.name : ''}</span>
                                </span>
                                <Icon name="chevron_right" className="muted" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const v = preview?.validation;
    const s = preview?.stats;
    const checks = preview ? [
        { ok: true, text: t('import.check.type') },
        { ok: !(v?.errors?.length), text: t('import.check.columns') },
        { ok: true, text: t('import.check.rows', { n: s?.totalRows ?? 0, bad: (s?.totalRows ?? 0) - (s?.validRows ?? 0) }) },
        ...(v?.warnings ?? []).map((w) => ({ ok: false, warn: true, text: w })),
    ] : [];
    const ready = !!file && fileErrors.length === 0 && !!preview && (mode === 'create' ? !!districtName.trim() : !!districtId);

    return (
        <div className="page">
            <header className="page__header">
                <div className="page__title-block">
                    <h1 className="t-title-l">{mode === 'create' ? t('import.titleCreate') : t('import.titleUpdate')} · {area.name}</h1>
                    <p className="page__subtitle t-small">{districts.length} districten in dit gebied · <button type="button" className="btn btn--link" onClick={() => navigate('/district-management')}>ander gebied</button></p>
                </div>
                <div className="page__actions">
                    <Segmented
                        ink
                        value={mode}
                        onChange={(m) => { setMode(m); setConflicts(null); }}
                        aria-label="Importmodus"
                        options={[
                            { value: 'create', label: t('import.modeCreate'), icon: 'add' },
                            { value: 'update', label: t('import.modeUpdate'), icon: 'sync' },
                        ]}
                    />
                </div>
            </header>

            <div className="import">
                <Panel title={t('import.step1')} icon="upload_file">
                    <div className="col gap-4">
                        {mode === 'create' ? (
                            <Field label={t('import.districtName')} required>
                                {(id) => <Input id={id} value={districtName} onChange={(e) => setDistrictName(e.target.value)} placeholder="Bijv. Terwijde Noord" maxLength={100} />}
                            </Field>
                        ) : (
                            <Field label={t('import.districtPick')} required>
                                {(id) => (
                                    <Select id={id} value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
                                        {districts.length === 0 && <option value="">Geen districten in dit gebied</option>}
                                        {districts.map((d) => <option key={d._id} value={d._id}>#{d.priority ?? '–'} {d.name}</option>)}
                                    </Select>
                                )}
                            </Field>
                        )}
                        <div
                            className={`dropzone ${over ? 'is-over' : ''}`.trim()}
                            onClick={() => fileInput.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                            onDragLeave={() => setOver(false)}
                            onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0] ?? null); }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.current?.click(); }}
                        >
                            <Icon name={file ? 'description' : 'upload_file'} />
                            {file ? (
                                <>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</span>
                                    <span className="t-caption">{(file.size / 1024).toFixed(0)} kB · {t('import.changeFile')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('import.dropHint')}</span>
                                    <span className="t-caption muted">{t('import.rules')}</span>
                                </>
                            )}
                            <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { pick(e.target.files?.[0] ?? null); e.target.value = ''; }} />
                        </div>
                        {previewing && <span className="t-small muted row"><Icon name="sync" /> Bestand wordt gelezen…</span>}
                        {(fileErrors.length > 0 || checks.length > 0) && (
                            <div className="checks">
                                {fileErrors.map((e) => <span key={e} className="check check--fail"><Icon name="error" />{e}</span>)}
                                {checks.map((c) => (
                                    <span key={c.text} className={`check ${c.ok ? 'check--ok' : 'warn' in c && c.warn ? 'check--warn' : 'check--fail'}`}>
                                        <Icon name={c.ok ? 'check_circle' : 'warn' in c && c.warn ? 'warning' : 'error'} />
                                        {c.text}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="row">
                            {file && <Button variant="ghost" size="dense" icon="close" onClick={reset}>{t('common.clear')}</Button>}
                            <Button className="ml-auto" variant="primary" icon={mode === 'create' ? 'upload' : 'sync'} onClick={start} loading={starting} disabled={!ready}>
                                {mode === 'create' ? t('import.start') : t('import.startUpdate')}
                            </Button>
                        </div>
                    </div>
                </Panel>

                <Panel title={t('import.step2')} icon="difference">
                    {!preview ? (
                        <p className="t-small muted">Kies een bestand om de gevolgen te zien.</p>
                    ) : (
                        <div className="col gap-4">
                            <div className="mini-stats">
                                <div className="mini-stat"><span className="t-overline">{t('import.preview.buildings')}</span><span className="mini-stat__v">{s?.totalBuildings ?? 0}</span></div>
                                <div className="mini-stat"><span className="t-overline">{t('import.preview.flats')}</span><span className="mini-stat__v">{s?.totalFlats ?? 0}</span></div>
                                <div className="mini-stat"><span className="t-overline">{mode === 'update' ? t('import.preview.changed') : 'Rijen'}</span><span className="mini-stat__v" style={mode === 'update' && (conflicts?.length ?? 0) > 0 ? { color: 'var(--status-progress-fg)' } : undefined}>{mode === 'update' ? (conflicts?.length ?? '…') : s?.totalRows ?? 0}</span></div>
                            </div>
                            {preview.buildingPreview && preview.buildingPreview.length > 0 && (
                                <div className="col">
                                    <span className="t-overline">Eerste gebouwen</span>
                                    {preview.buildingPreview.map((b) => (
                                        <span key={b.keyName} className="schedule-row"><Icon name="apartment" className="muted" /><span className="grow">{b.address} {b.houseNumber}</span><span className="mono muted">{b.flats} flats</span></span>
                                    ))}
                                </div>
                            )}
                            {mode === 'update' && (
                                conflicts === null ? (
                                    <span className="t-small muted">Wijzigingen worden gecontroleerd…</span>
                                ) : conflicts.length === 0 ? (
                                    <span className="check check--ok"><Icon name="check_circle" />{t('import.noConflicts')}</span>
                                ) : (
                                    <div className="col gap-2">
                                        <span className="check check--warn"><Icon name="warning" />{t('import.conflicts', { n: conflicts.length })} · bestaande afspraken blijven staan</span>
                                        <div className="table-wrap table-wrap--scroll">
                                            <table className="table table--dense">
                                                <thead><tr><th>Flat</th><th>Velden</th></tr></thead>
                                                <tbody>
                                                    {conflicts.slice(0, 50).map((c, i) => (
                                                        <tr key={`${c.zoeksleutel}-${i}`}>
                                                            <td><span className="col"><span>{c.address}</span>{c.zoeksleutel && <KeyChip>{c.zoeksleutel}</KeyChip>}</span></td>
                                                            <td className="t-caption">{c.changedFields.length > 0 ? c.changedFields.map((f) => FIELD_LABELS[f] ?? f).join(', ') : c.conflictReason ?? 'Bestaat al'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </Panel>

                <div className="col gap-4">
                    <Panel title={t('import.step3')} icon="event_repeat">
                        <div className="ritual">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="ritual__step"><span className="ritual__n">{n}</span><span>{t(`import.ritual.${n}` as 'import.ritual.1')}</span></div>
                            ))}
                        </div>
                    </Panel>
                    <Panel title={t('import.recent')} icon="history" flush>
                        {!history || history.history.length === 0 ? (
                            <EmptyState icon="history" title="Nog geen imports in dit gebied" />
                        ) : (
                            <div className="list">
                                {history.history.slice(0, 8).map((h) => (
                                    <button key={h._id} type="button" className="list__item" style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--bg-subtle)', width: '100%', textAlign: 'left' }} onClick={() => navigate(`/district/${areaId}?district=${h._id}`)}>
                                        <Icon name="grid_view" className="muted" />
                                        <span className="list__body">
                                            <span className="list__title">{h.name}</span>
                                            <span className="list__meta">{h.stats?.buildings ?? 0} gebouwen · {h.stats?.flats ?? 0} flats · {fmtDateTime(h.updatedAt ?? h.createdAt)}</span>
                                        </span>
                                        <Icon name="chevron_right" className="chev" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            </div>

            {importId && <ImportProgressDialog importId={importId} onComplete={onComplete} onError={onFail} onCancel={onCancel} />}
        </div>
    );
};

export default ImportPage;
