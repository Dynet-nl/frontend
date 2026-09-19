// Book technical surveys or HAS installations for one flat or a whole building. One form,
// many flats: every flat reports its own result (created / skipped because the person is
// already busy / failed), so a partial save is never a mystery.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import useAuth from '../hooks/useAuth';
import axiosPrivate from '../api/axios';
import { useApi } from '../hooks/useApi';
import { usePersonnel } from '../hooks/usePersonnel';
import { useNotification } from '../context/NotificationProvider';
import { usePageChrome } from '../components/shell/ShellContext';
import AppointmentLine from '../components/AppointmentLine';
import { t } from '../i18n';
import { isoWeek, todayInputDate, toInputDate, fmtDayMonth, fmtRange } from '../utils/format';
import { deliveryStatus, hasTypeStatus } from '../utils/status';
import { canScheduleHas, canScheduleTechnical, ScheduleType } from '../utils/routes';
import { summarize, flatDisplayName, flatFloorLabel } from '../utils/buildingSummary';
import { isFlatCompleted } from '../utils/completionUtils';
import type { Building, Flat } from '../types/domain';
import { Button, Segmented, Panel, Field, Input, Select, Textarea, Checkbox, KeyChip, StatusText, Icon, Pill, ErrorState, SkeletonRows, EmptyState } from '../components/ui';

type Result = { state: 'ok' | 'warn' | 'fail'; text: string };

interface FormState {
    date: string;
    startTime: string;
    endTime: string;
    person: string;
    type: 'HAS' | 'Storing' | 'Complaint';
    complaintDetails: string;
}

const padTime = (v: string) => (v && v.length === 4 ? `0${v}` : v);

const SchedulerPage: React.FC = () => {
    const { id = '' } = useParams<{ id: string }>();
    const [search, setSearch] = useSearchParams();
    const navigate = useNavigate();
    const { auth } = useAuth();
    const roles = useMemo(() => auth.roles ?? [], [auth.roles]);
    const { showSuccess, showWarning, showError } = useNotification();

    const mode = search.get('mode') === 'single' ? 'single' : 'building';
    const canTech = canScheduleTechnical(roles);
    const canHas = canScheduleHas(roles);
    const requestedType = (search.get('type') || '').toUpperCase() === 'HAS' ? 'HAS' : (search.get('type') || '').toUpperCase() === 'TECHNICAL' ? 'Technical' : null;
    const type: ScheduleType = requestedType && ((requestedType === 'HAS' && canHas) || (requestedType === 'Technical' && canTech)) ? requestedType : canTech ? 'Technical' : 'HAS';
    const isHas = type === 'HAS';

    const { data: building, loading: lb, error: eb, reload: rb } = useApi<Building>(mode === 'building' && id ? `/api/building/${id}` : null);
    const { data: single, loading: ls, error: es, reload: rs } = useApi<Flat & { building?: string }>(mode === 'single' && id ? `/api/apartment/${id}` : null);
    const { people } = usePersonnel(isHas ? 'HASMonteur' : 'TechnischeSchouwer');

    const flats: Flat[] = useMemo(() => {
        if (mode === 'single') return single ? [single] : [];
        return building ? summarize(building).flatsTopFirst : [];
    }, [mode, single, building]);
    const blocked = !!building?.isBlocked;

    const titleName = mode === 'single' ? (single ? flatDisplayName(single) : '…') : building?.address ?? '…';
    usePageChrome(
        [
            { label: t('nav.districts'), path: '/districts' },
            ...(mode === 'single' && single?.building ? [{ label: building?.address || 'Gebouw', path: `/building/${single.building}` }] : []),
            { label: `${t('common.schedule')} · ${titleName}` },
        ],
        `${t('common.schedule')} · ${titleName}`
    );

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [results, setResults] = useState<Record<string, Result>>({});
    const [form, setForm] = useState<FormState>({ date: todayInputDate(), startTime: '', endTime: '', person: '', type: 'HAS', complaintDetails: '' });
    const [saving, setSaving] = useState(false);
    const [summary, setSummary] = useState<{ created: number; skipped: number; failed: number } | null>(null);

    // Preselect once per (id, type): the single flat, or every not-yet-delivered flat of the
    // building. A reload after saving must not wipe the per-flat results.
    const initKey = `${mode}|${id}|${type}`;
    const initialized = useRef<string | null>(null);
    useEffect(() => {
        if (flats.length === 0 || initialized.current === initKey) return;
        initialized.current = initKey;
        if (mode === 'single') {
            const f = flats[0];
            setSelected(new Set([f._id]));
            const appt = isHas ? f.hasMonteur?.appointmentBooked : f.technischePlanning?.appointmentBooked;
            const person = isHas ? f.hasMonteur?.hasMonteurName : f.technischePlanning?.technischeSchouwerName;
            if (appt?.date) {
                setForm({
                    date: toInputDate(appt.date),
                    startTime: appt.startTime || '',
                    endTime: appt.endTime || '',
                    person: person || '',
                    type: (appt.type as FormState['type']) || 'HAS',
                    complaintDetails: appt.complaintDetails || '',
                });
            }
        } else {
            setSelected(new Set(flats.filter((f) => !isFlatCompleted(f)).map((f) => f._id)));
        }
        setResults({});
        setSummary(null);
    }, [flats, mode, isHas, initKey]);

    const setType = (next: ScheduleType) => {
        setSearch((prev) => { const p = new URLSearchParams(prev); p.set('type', next); return p; }, { replace: true });
        setForm((f) => ({ ...f, person: '' }));
        setResults({});
        setSummary(null);
    };

    const toggle = (fid: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(fid)) n.delete(fid); else n.add(fid); return n; });
    const allSelected = flats.length > 0 && flats.every((f) => selected.has(f._id));

    const week = form.date ? isoWeek(form.date) : null;
    const endBeforeStart = !!form.startTime && !!form.endTime && padTime(form.endTime) <= padTime(form.startTime);
    const inPast = !!form.date && form.date < todayInputDate();
    const canSave = !blocked && selected.size > 0 && !!form.date && !!form.startTime && !!form.endTime && !endBeforeStart && !!form.person && (!isHas || form.type !== 'Complaint' || !!form.complaintDetails.trim());

    const save = async () => {
        if (!canSave) {
            if (selected.size === 0) showError(t('scheduler.selectSomething'));
            else if (!form.person) showError(t('scheduler.pickPerson'));
            return;
        }
        if (inPast) showWarning(t('scheduler.past'));
        setSaving(true);
        const start = padTime(form.startTime);
        const end = padTime(form.endTime);
        const outcomes: Record<string, Result> = {};
        let created = 0; let skipped = 0; let failed = 0;
        await Promise.all(
            Array.from(selected).map(async (fid) => {
                const payload = isHas
                    ? { appointmentBooked: { date: form.date, startTime: start, endTime: end, weekNumber: week, type: form.type, ...(form.type === 'Complaint' ? { complaintDetails: form.complaintDetails.trim() } : {}) }, hasMonteurName: form.person }
                    : { appointmentBooked: { date: form.date, startTime: start, endTime: end, weekNumber: week }, technischeSchouwerName: form.person };
                try {
                    await axiosPrivate.put(`/api/apartment/${fid}/${isHas ? 'has-monteur' : 'technische-planning'}`, payload);
                    outcomes[fid] = { state: 'ok', text: t('scheduler.created', { when: `${fmtDayMonth(form.date)} ${fmtRange(start, end)}`, person: form.person }) };
                    created += 1;
                } catch (err) {
                    const ax = err as AxiosError<{ message?: string }>;
                    if (ax.response?.status === 409) {
                        outcomes[fid] = { state: 'warn', text: t('scheduler.skipped', { reason: `${form.person} is op dat tijdstip al bezet` }) };
                        skipped += 1;
                    } else {
                        outcomes[fid] = { state: 'fail', text: ax.response?.data?.message || 'Opslaan mislukt' };
                        failed += 1;
                    }
                }
            })
        );
        setResults(outcomes);
        setSummary({ created, skipped, failed });
        setSaving(false);
        if (failed === 0 && skipped === 0) showSuccess(t('scheduler.resultCreated', { n: created }));
        else if (created > 0) showWarning(`${t('scheduler.resultCreated', { n: created })} · ${skipped ? t('scheduler.resultSkipped', { n: skipped }) : ''} ${failed ? t('scheduler.resultFailed', { n: failed }) : ''}`.trim());
        else showError(skipped ? t('scheduler.resultSkipped', { n: skipped }) : t('scheduler.resultFailed', { n: failed }));
        if (mode === 'building') rb(); else rs();
    };

    const loading = mode === 'building' ? lb : ls;
    const error = mode === 'building' ? eb : es;
    const reload = mode === 'building' ? rb : rs;
    if (loading && flats.length === 0) return <SkeletonRows rows={5} />;
    if (error && flats.length === 0) return <ErrorState onRetry={reload} />;
    if (flats.length === 0) return <EmptyState icon="door_front" title="Geen flats gevonden" center />;

    const complex = flats.find((f) => f.complexNaam)?.complexNaam;

    return (
        <div className="page">
            <header className="page__header">
                <div className="page__title-block">
                    <div className="page__title">
                        <h1 className="t-title-l">{mode === 'single' ? t('scheduler.titleFlat', { flat: titleName }) : t('scheduler.title', { building: titleName })}</h1>
                        {blocked && <Pill family="blocked" icon="block" size="md">{t('common.blocked')}</Pill>}
                    </div>
                    <p className="page__subtitle t-small">{[complex, building?.postcode ?? flats[0]?.postcode, `${flats.length} ${flats.length === 1 ? 'flat' : 'flats'}`].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="page__actions">
                    {canTech && canHas && (
                        <Segmented
                            ink
                            value={type}
                            onChange={setType}
                            aria-label={t('scheduler.type')}
                            options={[
                                { value: 'Technical', label: t('scheduler.survey'), icon: 'search_check' },
                                { value: 'HAS', label: t('scheduler.has'), icon: 'construction' },
                            ]}
                        />
                    )}
                </div>
            </header>

            {blocked && (
                <div className="callout callout--danger">
                    <Icon name="block" />
                    <div><div className="callout__title">{t('common.scheduleBlocked')}</div>{building?.blockReason}</div>
                </div>
            )}

            <div className="scheduler">
                <Panel
                    title={mode === 'single' ? 'Flat' : t('scheduler.flats')}
                    icon="door_front"
                    flush
                    actions={mode === 'building' ? (
                        <Checkbox label={t('common.selectAll')} checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(flats.map((f) => f._id)))} />
                    ) : undefined}
                >
                    {flats.map((f) => {
                        const own = isHas ? f.hasMonteur?.appointmentBooked : f.technischePlanning?.appointmentBooked;
                        const ownPerson = isHas ? f.hasMonteur?.hasMonteurName : f.technischePlanning?.technischeSchouwerName;
                        const other = isHas ? f.technischePlanning?.appointmentBooked : f.hasMonteur?.appointmentBooked;
                        const otherPerson = isHas ? f.technischePlanning?.technischeSchouwerName : f.hasMonteur?.hasMonteurName;
                        const r = results[f._id];
                        const status = isFlatCompleted(f) ? deliveryStatus('2') : deliveryStatus(f.fcStatusHas);
                        return (
                            <div key={f._id} className={`sched-flat ${selected.has(f._id) ? 'is-selected' : ''} ${r?.state === 'warn' ? 'is-warn' : ''}`.trim()}>
                                <input type="checkbox" className="checkbox" checked={selected.has(f._id)} onChange={() => toggle(f._id)} disabled={mode === 'single'} aria-label={flatDisplayName(f)} style={{ marginTop: 3 }} />
                                <div className="sched-flat__body">
                                    <span className="sched-flat__name">
                                        <Link to={`/apartment/${f._id}`} style={{ color: 'inherit' }}>{flatDisplayName(f)}</Link>
                                        {f.zoeksleutel && <KeyChip>{f.zoeksleutel}</KeyChip>}
                                    </span>
                                    <span className="sched-flat__meta">{flatFloorLabel(f)}</span>
                                    {own?.date && (
                                        <span className="sched-flat__meta row">
                                            <span>{t('scheduler.existing')}:</span>
                                            <AppointmentLine kind={isHas ? 'has' : 'technical'} appointment={own} person={ownPerson} showType={isHas} />
                                        </span>
                                    )}
                                    {other?.date && (
                                        <span className="sched-flat__meta row">
                                            <span>{isHas ? t('agenda.survey') : t('scheduler.hasPlanned')}:</span>
                                            <AppointmentLine kind={isHas ? 'technical' : 'has'} appointment={other} person={otherPerson} showType={!isHas} />
                                        </span>
                                    )}
                                    {r && (
                                        <span className={`sched-flat__result sched-flat__result--${r.state}`}>
                                            <Icon name={r.state === 'ok' ? 'check_circle' : r.state === 'warn' ? 'error' : 'cancel'} />
                                            {r.text}
                                        </span>
                                    )}
                                </div>
                                <StatusText status={status} />
                            </div>
                        );
                    })}
                </Panel>

                <Panel title={t('scheduler.details')} icon={isHas ? 'construction' : 'search_check'}>
                    <div className="col gap-4">
                        <div className="form-grid">
                            <Field label={t('scheduler.date')} required error={inPast ? t('scheduler.past') : undefined}>
                                {(fid) => <Input id={fid} type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />}
                            </Field>
                            <Field label={t('scheduler.week')}>
                                {(fid) => <Input id={fid} mono readOnly value={week ? `wk ${week}` : ''} />}
                            </Field>
                            <Field label={t('scheduler.start')} required>
                                {(fid) => <Input id={fid} type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />}
                            </Field>
                            <Field label={t('scheduler.end')} required error={endBeforeStart ? t('scheduler.endBeforeStart') : undefined}>
                                {(fid) => <Input id={fid} type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />}
                            </Field>
                            <div className="span-2">
                                <Field label={isHas ? t('scheduler.installer') : t('scheduler.surveyor')} required>
                                    {(fid) => (
                                        <Select id={fid} value={form.person} onChange={(e) => setForm((f) => ({ ...f, person: e.target.value }))}>
                                            <option value="">{t('scheduler.pick')}</option>
                                            {people.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
                                            {form.person && !people.some((p) => p.name === form.person) && <option value={form.person}>{form.person}</option>}
                                        </Select>
                                    )}
                                </Field>
                            </div>
                            {isHas && (
                                <div className="span-2 col gap-3">
                                    <Field label={t('scheduler.type')}>
                                        {() => (
                                            <Segmented
                                                value={form.type}
                                                onChange={(v) => setForm((f) => ({ ...f, type: v }))}
                                                options={[
                                                    { value: 'HAS', label: t('agenda.type.HAS'), icon: 'construction' },
                                                    { value: 'Storing', label: t('agenda.type.Storing'), icon: 'bolt' },
                                                    { value: 'Complaint', label: t('agenda.type.Complaint'), icon: 'flag' },
                                                ]}
                                            />
                                        )}
                                    </Field>
                                    {form.type === 'Complaint' && (
                                        <Field label={t('scheduler.complaintDetails')} required>
                                            {(fid) => <Textarea id={fid} value={form.complaintDetails} onChange={(e) => setForm((f) => ({ ...f, complaintDetails: e.target.value }))} />}
                                        </Field>
                                    )}
                                    {form.type !== 'HAS' && <StatusText status={hasTypeStatus(form.type)} />}
                                </div>
                            )}
                        </div>

                        {summary && (
                            <div className={`callout ${summary.failed ? 'callout--danger' : summary.skipped ? 'callout--warning' : 'callout--success'}`}>
                                <Icon name={summary.failed ? 'error' : summary.skipped ? 'warning' : 'check_circle'} />
                                <div>
                                    <div className="callout__title">{t('scheduler.lastResult')}</div>
                                    {t('scheduler.resultCreated', { n: summary.created })}
                                    {summary.skipped ? ` · ${t('scheduler.resultSkipped', { n: summary.skipped })}` : ''}
                                    {summary.failed ? ` · ${t('scheduler.resultFailed', { n: summary.failed })}` : ''}
                                </div>
                            </div>
                        )}

                        <div className="row sticky-action">
                            <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving}>{t('common.back')}</Button>
                            <Button className="ml-auto" variant="primary" icon="event_available" onClick={save} loading={saving} disabled={!canSave}>
                                {selected.size === 1 ? t('scheduler.saveOne') : t('scheduler.save', { n: selected.size })}
                            </Button>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
};

export default SchedulerPage;
