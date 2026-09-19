// Building floor plan & cables. Three steps kept from the old page (structure → floors →
// cables), drawn as one readable column per block with the cable run beside it.

import React, { useCallback, useEffect, useMemo, useState, ChangeEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosPrivate from '../api/axios';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../context/NotificationProvider';
import { useError } from '../context/ErrorProvider';
import { usePageChrome, TopbarActions } from '../components/shell/ShellContext';
import BuildingSchema from '../components/schema/BuildingSchema';
import { SHAPES, ShapeKey, isShapeKey } from '../components/schema/shapes';
import { BlockConfig, Building as LayoutBuilding, Schedule, INITIAL_BLOCK, buildFloors } from '../types/building';
import { t } from '../i18n';
import { fmtDayMonth, fmtRange, todayInputDate } from '../utils/format';
import { categorizeBuilding } from '../utils/buildingCategorization';
import { flatLabel } from '../types/domain';
import { Button, LinkButton, Panel, Field, Select, Input, Icon, Pill, ConfirmModal, ErrorState, SkeletonRows, EmptyState } from '../components/ui';

const FLOOR_CHOICES = [
    { value: 0, label: 'Begane grond (BG)' },
    { value: 1, label: '1e verdieping' },
    { value: 2, label: '2e verdieping' },
    { value: 3, label: '3e verdieping' },
    { value: 4, label: '4e verdieping' },
    { value: 5, label: '5e verdieping' },
    { value: 6, label: '6e verdieping' },
    { value: 7, label: '7e verdieping' },
    { value: 8, label: '8e verdieping' },
];

const TYPE_LABELS: Record<ShapeKey, string> = {
    leftWing: 'Linkervleugel',
    rightWing: 'Rechtervleugel',
    noStairs: 'Zonder trap',
    leftWingApart: 'Links apart',
    rightWingApart: 'Rechts apart',
    leftWingNoBG: 'Links zonder BG',
    rightWingNoBG: 'Rechts zonder BG',
    leftWingFlat: 'Links plat',
    rightWingFlat: 'Rechts plat',
    doubleNoBGsWing: 'Dubbel, geen BG',
    doubleNoLeftBGWing: 'Dubbel, links geen BG',
    doubleNoRightBGWing: 'Dubbel, rechts geen BG',
};

/** Tiny glyph for the type picker: bars per column, stairs bar, hollow bottom for no ground floor. */
const TypeGlyph: React.FC<{ shape: ShapeKey }> = ({ shape }) => {
    const spec = SHAPES[shape];
    const col = (c: typeof spec.columns[number], key: string) => (
        <span key={key} style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2 }}>
            <span className={c.first?.empty ? 'hollow' : ''} style={{ width: 12, height: 8, borderRadius: 2, background: c.first?.empty ? 'transparent' : 'var(--border-strong)', border: c.first?.empty ? '1px dashed var(--border-strong)' : undefined }} />
            <span style={{ width: 12, height: 8, borderRadius: 2, background: 'var(--border-strong)' }} />
            <span style={{ width: 12, height: 8, borderRadius: 2, background: 'var(--border-strong)' }} />
        </span>
    );
    const stairs = <span className="stairs" style={{ width: 8, height: 26, borderRadius: 2, background: 'var(--text-muted)', opacity: 0.5 }} />;
    return (
        <span className="type-glyph" aria-hidden="true">
            {spec.columns.length === 2 ? (
                <>{col(spec.columns[0], 'a')}{stairs}{col(spec.columns[1], 'b')}</>
            ) : spec.stairs === 'before' && spec.reversed ? (
                <>{stairs}{col(spec.columns[0], 'a')}</>
            ) : spec.stairs === 'before' ? (
                <>{col(spec.columns[0], 'a')}{stairs}</>
            ) : (
                col(spec.columns[0], 'a')
            )}
        </span>
    );
};

const BuildingPage: React.FC = () => {
    const { id = '' } = useParams<{ id: string }>();
    const { showSuccess, showError } = useNotification();
    const { handleApiError } = useError();
    const { data: building, loading, error, reload } = useApi<LayoutBuilding & { postcode?: string; district?: string; isBlocked?: boolean; blockReason?: string; flats?: Array<{ _id: string; adres?: string; huisNummer?: string; toevoeging?: string; complexNaam?: string; zoeksleutel?: string; postcode?: string }> }>(id ? `/api/building/${id}` : null);

    const [blocks, setBlocks] = useState<BlockConfig[]>([{ ...INITIAL_BLOCK }]);
    const [active, setActive] = useState(0);
    const [layoutExists, setLayoutExists] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [removeIndex, setRemoveIndex] = useState<number | null>(null);
    const [cable, setCable] = useState<number | null>(null);
    const [schedule, setSchedule] = useState({ date: todayInputDate(), from: '08:00', till: '12:00' });
    const [scheduling, setScheduling] = useState(false);
    const [schedules, setSchedules] = useState<Schedule[]>([]);

    useEffect(() => {
        if (!building) return;
        if (building.layout?.blocks?.length) {
            setBlocks(building.layout.blocks);
            setLayoutExists(true);
        }
        setSchedules(building.schedules ?? []);
        setDirty(false);
    }, [building]);

    const complex = building?.flats?.find((f) => f.complexNaam)?.complexNaam;
    const title = building ? `${building.address ?? building.name ?? ''}${complex ? ` · ${complex}` : ''}` : '…';
    usePageChrome(
        [
            { label: t('nav.districts'), path: building?.district ? `/districts` : '/districts' },
            { label: building?.address ?? '…' },
        ],
        building?.address
    );

    const cableNumbers = useMemo(() => {
        const set = new Set<number>();
        blocks.forEach((b) => b.floors?.forEach((f) => { if (f.cableNumber) set.add(Number(f.cableNumber)); }));
        return Array.from(set).sort((a, b) => a - b);
    }, [blocks]);

    const mapped = useMemo(() => {
        let assigned = 0;
        let total = 0;
        blocks.forEach((b) => b.floors?.forEach((f) => { total += 1; if (f.flat) assigned += 1; }));
        return { assigned, total };
    }, [blocks]);

    const hasStructure = blocks.some((b) => b.blockType && b.topFloor !== '');
    const stepState = (n: number): 'done' | 'now' | 'todo' => {
        if (n === 1) return hasStructure ? 'done' : 'now';
        if (n === 2) return mapped.total > 0 && mapped.assigned === mapped.total ? 'done' : hasStructure ? 'now' : 'todo';
        return cableNumbers.length > 0 ? (schedules.length > 0 ? 'done' : 'now') : 'todo';
    };

    const cableFlats = useMemo(() => {
        if (cable === null) return [];
        const ids: string[] = [];
        blocks.forEach((b) => b.floors?.forEach((f) => { if (Number(f.cableNumber) === cable && f.flat) ids.push(f.flat); }));
        return ids.map((fid) => ({ id: fid, flat: building?.flats?.find((f) => f._id === fid), length: blocks.flatMap((b) => b.floors ?? []).find((f) => f.flat === fid)?.cableLength }));
    }, [cable, blocks, building]);

    const updateBlock = (index: number, patch: Partial<BlockConfig>) => {
        setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
        setDirty(true);
    };

    const setTopFloor = (index: number, value: string) => {
        const top = value === '' ? '' : Number(value);
        const block = blocks[index];
        updateBlock(index, { topFloor: top, floors: buildFloors(block.firstFloor, top, block.floors) });
    };

    const setType = (index: number, type: ShapeKey) => {
        const block = blocks[index];
        updateBlock(index, { blockType: type, floors: buildFloors(block.firstFloor, block.topFloor, block.floors) });
    };

    const handleFlatDetails = useCallback((event: ChangeEvent<HTMLSelectElement | HTMLInputElement>, index: number, parentIndex: number) => {
        const { name, value } = event.target;
        const next = name === 'cableNumber' || name === 'cableLength' ? (value === '' ? undefined : parseInt(value, 10)) : value;
        setBlocks((prev) => prev.map((b, bi) => (bi !== parentIndex ? b : { ...b, floors: b.floors.map((f, fi) => (fi !== index ? f : { ...f, [name]: next })) })));
        setDirty(true);
    }, []);

    const save = async () => {
        if (blocks.some((b) => !b.blockType || b.topFloor === '')) {
            showError('Kies voor elk blok een indelingstype en hoogste verdieping.');
            return;
        }
        setSaving(true);
        try {
            if (layoutExists) await axiosPrivate.put(`/api/building/layout/${id}`, blocks);
            else await axiosPrivate.post(`/api/building/layout/${id}`, blocks);
            setLayoutExists(true);
            setDirty(false);
            showSuccess(layoutExists ? 'Plattegrond bijgewerkt' : 'Plattegrond vastgelegd');
        } catch (err) {
            handleApiError(err, 'Plattegrond kon niet worden opgeslagen.');
        } finally {
            setSaving(false);
        }
    };

    const createSchedule = async () => {
        if (cable === null) { showError(t('building.selectCable')); return; }
        if (cableFlats.length === 0) { showError('Geen flats op deze kabel. Koppel flats bij stap 2.'); return; }
        if (!schedule.date || !schedule.from || !schedule.till) { showError('Vul datum, van en tot in.'); return; }
        setScheduling(true);
        try {
            await axiosPrivate.post(`/api/schedule/${id}`, { cableNumber: cable, date: schedule.date, from: schedule.from, till: schedule.till, flats: cableFlats.map((c) => c.id) });
            showSuccess('Kabelplanning aangemaakt');
            await reload();
        } catch (err) {
            handleApiError(err, 'Kabelplanning kon niet worden aangemaakt.');
        } finally {
            setScheduling(false);
        }
    };

    const topbar = useMemo(
        () => (
            <>
                {dirty && <Pill family="progress" icon="edit">{t('building.unsaved')}</Pill>}
                <Button variant="primary" size="dense" icon="save" onClick={save} loading={saving}>{layoutExists ? t('building.saveLayoutExisting') : t('building.saveLayout')}</Button>
            </>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dirty, saving, layoutExists, blocks]
    );

    if (loading && !building) return <SkeletonRows rows={6} />;
    if (error && !building) return <ErrorState onRetry={reload} />;
    if (!building) return null;

    const cat = categorizeBuilding(building.flats ?? []);
    const block = blocks[active] ?? blocks[0];

    return (
        <div className="page">
            <TopbarActions>{topbar}</TopbarActions>
            <header className="page__header">
                <div className="page__title-block">
                    <div className="page__title">
                        <h1 className="t-title-l">{title}</h1>
                        {building.isBlocked && <Pill family="blocked" icon="block" size="md" title={building.blockReason}>{t('common.blocked')}</Pill>}
                    </div>
                    <p className="page__subtitle t-small">
                        {[building.postcode, cat.typeString, `${building.flats?.length ?? 0} flats`, `${blocks.filter((b) => b.blockType).length} ${blocks.filter((b) => b.blockType).length === 1 ? 'blok' : 'blokken'}`, `${cableNumbers.length} ${cableNumbers.length === 1 ? 'kabel' : 'kabels'}`].filter(Boolean).join(' · ')}
                    </p>
                </div>
                <div className="page__actions">
                    <div className="wizard" aria-label="Stappen">
                        {[1, 2, 3].map((n) => (
                            <span key={n} className={`wizard__step wizard__step--${stepState(n)}`}>
                                <span className="wizard__n">{stepState(n) === 'done' ? '✓' : n}</span>
                                {t(n === 1 ? 'building.step1' : n === 2 ? 'building.step2' : 'building.step3')}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            {building.isBlocked && (
                <div className="callout callout--danger">
                    <Icon name="block" />
                    <div><div className="callout__title">{t('common.blocked')}</div>{building.blockReason}</div>
                </div>
            )}

            {/* Step 1 */}
            <Panel title={t('building.step1.title')} icon="foundation">
                <div className="col gap-4">
                    <div className="blocks" role="tablist">
                        {blocks.map((b, i) => (
                            <button key={i} type="button" role="tab" aria-selected={active === i} className={`chip ${active === i ? 'chip--active' : ''} ${!b.blockType ? 'chip--danger' : ''}`.trim()} onClick={() => setActive(i)}>
                                {t('building.block')} {i + 1}{b.blockType ? ` · ${TYPE_LABELS[b.blockType as ShapeKey] ?? b.blockType}` : ''}
                            </button>
                        ))}
                        <Button variant="ghost" size="dense" icon="add" onClick={() => { setBlocks((p) => [...p, { ...INITIAL_BLOCK }]); setActive(blocks.length); setDirty(true); }}>
                            {t('building.addBlock')}
                        </Button>
                        {blocks.length > 1 && (
                            <Button variant="ghost" size="dense" icon="delete" className="ml-auto" onClick={() => setRemoveIndex(active)}>
                                {t('building.removeBlock')}
                            </Button>
                        )}
                    </div>
                    {block && (
                        <div className="form-grid">
                            <Field label={t('building.topFloor')}>
                                {(fid) => (
                                    <Select id={fid} value={block.topFloor === '' ? '' : String(block.topFloor)} onChange={(e) => setTopFloor(active, e.target.value)}>
                                        <option value="">{t('scheduler.pick')}</option>
                                        {FLOOR_CHOICES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </Select>
                                )}
                            </Field>
                            <div className="span-2 col gap-2">
                                <span className="field__label">{t('building.layoutType')}</span>
                                <div className="type-grid" role="radiogroup" aria-label={t('building.layoutType')}>
                                    {(Object.keys(SHAPES) as ShapeKey[]).map((key) => (
                                        <button key={key} type="button" role="radio" aria-checked={block.blockType === key} className={`type-opt ${block.blockType === key ? 'is-active' : ''}`.trim()} onClick={() => setType(active, key)}>
                                            <TypeGlyph shape={key} />
                                            {TYPE_LABELS[key]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Panel>

            {/* Step 2 */}
            <Panel
                title={t('building.step2.title')}
                icon="stairs"
                actions={hasStructure ? <span className="t-caption secondary">{t('building.mapped', { n: mapped.assigned, total: mapped.total })} · {t('building.legend')}</span> : undefined}
            >
                {!hasStructure ? (
                    <EmptyState icon="foundation" title="Maak eerst de structuur" text="Kies bij stap 1 een indelingstype en de hoogste verdieping van elk blok." />
                ) : (
                    <div className="plan">
                        {blocks.map((b, i) => (
                            isShapeKey(b.blockType) && b.topFloor !== '' ? (
                                <div key={i} className="plan__block">
                                    <div className="plan__title">
                                        <Icon name="stairs" />
                                        {t('building.block')} {i + 1} · {TYPE_LABELS[b.blockType]}
                                    </div>
                                    <BuildingSchema
                                        shape={b.blockType}
                                        form={b}
                                        editable={{ building: { _id: building._id, flats: building.flats ?? [] }, parentIndex: i, formFields: blocks, handleFlatDetails }}
                                    />
                                </div>
                            ) : (
                                <div key={i} className="plan__block">
                                    <div className="plan__title muted"><Icon name="stairs" />{t('building.block')} {i + 1} · nog niet ingericht</div>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </Panel>

            {/* Step 3 */}
            <div className="grid grid--2">
                <Panel title={t('building.step3.title')} icon="cable">
                    {cableNumbers.length === 0 ? (
                        <p className="t-small muted">{t('building.noCables')}</p>
                    ) : (
                        <div className="col gap-3">
                            <div className="chips">
                                {cableNumbers.map((n) => (
                                    <button key={n} type="button" className={`chip ${cable === n ? 'chip--active' : ''}`.trim()} onClick={() => setCable(n)} aria-pressed={cable === n}>
                                        <Icon name="cable" size="dense" /> Kabel {n}
                                    </button>
                                ))}
                            </div>
                            {cable === null ? (
                                <p className="t-small muted">{t('building.selectCable')}</p>
                            ) : (
                                <>
                                    <div className="t-small secondary">{t('building.flatsOnCable', { n: cable })}</div>
                                    <div className="cable-list">
                                        {cableFlats.length === 0 && <span className="t-small muted">Geen flats gekoppeld aan deze kabel.</span>}
                                        {cableFlats.map((c) => (
                                            <span key={c.id} className="cable-item">
                                                <Icon name="door_front" />
                                                <Link to={`/apartment/${c.id}`}>{c.flat ? flatLabel(c.flat) : c.id}</Link>
                                                {c.length ? <span className="mono muted">{c.length} m</span> : null}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </Panel>
                <Panel title={t('building.cableSchedule')} icon="event">
                    <div className="col gap-3">
                        <div className="form-grid">
                            <Field label={t('building.date')}>{(fid) => <Input id={fid} type="date" value={schedule.date} onChange={(e) => setSchedule((s) => ({ ...s, date: e.target.value }))} />}</Field>
                            <div className="row gap-3">
                                <Field label={t('building.from')} className="grow">{(fid) => <Input id={fid} type="time" value={schedule.from} onChange={(e) => setSchedule((s) => ({ ...s, from: e.target.value }))} />}</Field>
                                <Field label={t('building.till')} className="grow">{(fid) => <Input id={fid} type="time" value={schedule.till} onChange={(e) => setSchedule((s) => ({ ...s, till: e.target.value }))} />}</Field>
                            </div>
                        </div>
                        <div>
                            <Button variant="accent" icon="event" onClick={createSchedule} loading={scheduling} disabled={cable === null || cableFlats.length === 0}>
                                {t('building.createSchedule')}{cable !== null ? ` · Kabel ${cable}` : ''}
                            </Button>
                        </div>
                        {schedules.length > 0 && (
                            <div className="col">
                                <span className="t-overline">{t('building.existingSchedules')}</span>
                                {schedules.map((s, i) => (
                                    <div key={s._id ?? i} className="schedule-row">
                                        <Icon name="cable" className="muted" />
                                        <span className="mono">Kabel {s.cableNumber}</span>
                                        <span className="mono">{fmtDayMonth(s.date)} · {fmtRange(s.from, s.till)}</span>
                                        <span className="muted t-caption ml-auto">{s.flats?.length ?? 0} flats</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Panel>
            </div>

            <div className="row">
                <LinkButton to="/districts" variant="ghost" icon="arrow_back">{t('common.back')}</LinkButton>
                <Button className="ml-auto" variant="primary" icon="save" onClick={save} loading={saving}>{layoutExists ? t('building.saveLayoutExisting') : t('building.saveLayout')}</Button>
            </div>

            <ConfirmModal
                open={removeIndex !== null}
                onClose={() => setRemoveIndex(null)}
                onConfirm={() => { if (removeIndex !== null) { setBlocks((p) => p.filter((_, i) => i !== removeIndex)); setActive(0); setDirty(true); } setRemoveIndex(null); }}
                title={t('building.removeBlock')}
                message={t('building.removeBlockText')}
                confirmText={t('common.delete')}
            />
        </div>
    );
};

export default BuildingPage;
