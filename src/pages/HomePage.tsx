// Home: one endpoint, role-aware. Admin sees the whole operation; a planner sees their
// queue; a field worker sees today's route.

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { usePageChrome } from '../components/shell/ShellContext';
import { ROLES } from '../utils/constants';
import { t } from '../i18n';
import { greeting, fmtDayMonth, fmtRange, fmtPhone, telHref, mapsHref, daysAgo, fmtPercent, isoWeek, plural } from '../utils/format';
import { personColor, hasTypeStatus } from '../utils/status';
import { scheduleFlatHref } from '../utils/routes';
import { flatLabel } from '../types/domain';
import { Stat, Panel, Icon, LinkButton, KeyChip, Pill, ErrorState, SkeletonRows, EmptyState, ProgressBar } from '../components/ui';

interface FlatRef {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    complexNaam?: string;
    postcode?: string;
    zoeksleutel?: string;
    building?: string;
    fcStatusHas?: string;
    team?: string;
}

interface Appointment {
    kind: 'technical' | 'has';
    type: string;
    date: string;
    startTime?: string;
    endTime?: string;
    weekNumber?: number;
    person?: string;
    telephone?: string;
    installationStatus?: string;
    flat: FlatRef;
}

interface HomeData {
    user: { name: string; color: string | null; roles: number[] };
    weekNumber: number;
    overview: null | { cities: number; areas: number; districts: number; buildings: number; flats: number; completed: number; blocked: number; inProgress: number; scheduledThisWeek: number; withoutAppointment: number; weekNumber: number; overlaps: number };
    attention: null | Array<{ kind: string; title: string; detail?: string; meta?: string; date?: string; buildingId?: string; flatIds?: string[]; count?: number }>;
    pipeline: null | Array<{ key: string; count: number }>;
    callList: null | { total: number; calledNoAppointment: number; items: Array<{ flat: FlatRef; districtName?: string; districtPriority?: number; telephone: string | null; timesCalled: number; lastCalled: string | null; smsSent: boolean; readyForSchouwer: boolean }> };
    signedWithoutHas: null | { total: number; items: Array<{ flat: FlatRef; signedAt?: string; team?: string }> };
    buildingsWithoutLayout: null | { total: number; items: Array<{ _id: string; address: string; postcode?: string; flats: number; district?: string }> };
    blockedBuildings: null | Array<{ _id: string; address: string; postcode?: string; blockReason?: string; blockedAt?: string; blockedBy?: string; flats: number; district?: string }>;
    workload: null | Array<{ kind: string; person: string; count: number; color: string | null }>;
    mine: null | { today: Appointment[]; tomorrow: Appointment[]; week: Appointment[] };
    districts: Array<{ _id: string; name: string; priority?: number; area?: { _id: string; name: string } | null; buildings: number; flats: number; completed: number; completionPercentage: number }>;
}

const flatName = (f: FlatRef) => flatLabel(f) || f._id;

const PIPELINE_LABELS: Record<string, { label: string; icon: string }> = {
    technischePlanning: { label: 'Technische planning', icon: 'call' },
    technischeSchouw: { label: 'Technische schouw', icon: 'search_check' },
    hasPlanning: { label: 'HAS-planning', icon: 'calendar_month' },
    hasMontage: { label: 'HAS-montage', icon: 'bolt' },
    delivered: { label: 'Opgeleverd', icon: 'check_circle' },
};

const ATTENTION_ICON: Record<string, { icon: string; color: string }> = {
    blocked: { icon: 'block', color: 'var(--status-blocked-fg)' },
    import: { icon: 'sync_problem', color: 'var(--status-progress-fg)' },
    overlap: { icon: 'event_busy', color: 'var(--status-progress-fg)' },
    signedNoHas: { icon: 'draw', color: 'var(--status-planned-fg)' },
    userNoRole: { icon: 'person_off', color: 'var(--text-muted)' },
};

const AppointmentCard: React.FC<{ a: Appointment; color: string }> = ({ a, color }) => {
    const tel = telHref(a.telephone);
    return (
        <div className="today__item">
            <span className="today__bar" style={{ background: color }} />
            <span className="col" style={{ minWidth: 0 }}>
                <span className="today__time">{fmtRange(a.startTime, a.endTime)}</span>
                <Link to={`/apartment/${a.flat._id}`} className="today__where" style={{ color: 'inherit' }}>{flatName(a.flat)}</Link>
                <span className="today__who">{a.kind === 'has' ? hasTypeStatus(a.type).label : t('agenda.survey')}{a.flat.complexNaam ? ` · ${a.flat.complexNaam}` : ''}{a.flat.team ? ` · ${a.flat.team}` : ''}</span>
            </span>
            <span className="today__actions">
                {tel && <a className="btn btn--secondary btn--dense" href={tel} aria-label={t('home.call')}><Icon name="call" /><span className="hide-mobile">{t('home.call')}</span></a>}
                <a className="btn btn--secondary btn--dense" href={mapsHref(flatName(a.flat), a.flat.postcode)} target="_blank" rel="noreferrer" aria-label={t('home.route')}><Icon name="near_me" /><span className="hide-mobile">{t('home.route')}</span></a>
                <Link to={`/apartment/${a.flat._id}`} className="btn btn--ghost btn--dense btn--icon" aria-label={t('common.open')}><Icon name="chevron_right" /></Link>
            </span>
        </div>
    );
};

const HomePage: React.FC = () => {
    const { auth } = useAuth();
    const roles = useMemo(() => auth.roles ?? [], [auth.roles]);
    const has = (...r: number[]) => r.some((x) => roles.includes(x));
    const fieldOnly = has(ROLES.TECHNICAL_INSPECTOR, ROLES.HAS_MONTEUR) && !has(ROLES.ADMIN, ROLES.TECHNICAL_PLANNING, ROLES.HAS_PLANNING, ROLES.WERKVOORBEREIDER);
    usePageChrome([{ label: fieldOnly ? t('nav.today') : t('nav.home') }], fieldOnly ? t('nav.today') : t('nav.home'));

    const { data, loading, error, reload } = useApi<HomeData>('/api/dashboard/home');

    if (loading && !data) return <SkeletonRows rows={6} />;
    if (error && !data) return <ErrorState onRetry={reload} />;
    if (!data) return null;

    const name = data.user.name || auth.name || auth.email || '';
    const week = data.weekNumber || isoWeek(new Date());
    const ov = data.overview;

    const districtsPanel = data.districts.length > 0 && (
        <Panel title={t('home.districtsByPriority')} icon="grid_view" flush>
            <div className="list">
                {data.districts.map((d, i) => (
                    <Link key={d._id} to={d.area ? `/district/${d.area._id}?district=${d._id}` : '/districts'} className="list__item">
                        <span className="mono muted" style={{ width: 24 }}>#{d.priority || i + 1}</span>
                        <span className="list__body">
                            <span className="list__title">{d.name}</span>
                            <span className="list__meta">{[d.area?.name, plural(d.flats, 'flat')].filter(Boolean).join(' · ')}</span>
                        </span>
                        <span className="progress-inline" style={{ width: 120 }}>
                            <ProgressBar value={d.completionPercentage} size="sm" />
                            <span className="mono">{d.completionPercentage}%</span>
                        </span>
                        <Icon name="chevron_right" className="chev" />
                    </Link>
                ))}
            </div>
        </Panel>
    );

    const workloadRows = (data.workload ?? []).filter((w) => (has(ROLES.ADMIN) ? true : has(ROLES.TECHNICAL_PLANNING) ? w.kind === 'technical' : w.kind === 'has'));
    const workloadTitle = has(ROLES.ADMIN) ? 'Bezetting' : has(ROLES.TECHNICAL_PLANNING) ? 'Bezetting schouwers' : t('home.workload');
    const workloadPanel = workloadRows.length > 0 && (
        <Panel title={`${workloadTitle} · wk ${week}`} icon="groups">
            <div className="workload">
                {workloadRows.slice(0, 8).map((w, i) => {
                    const max = Math.max(...workloadRows.map((x) => x.count), 1);
                    return (
                        <div key={`${w.kind}-${w.person}`} className="workload__row">
                            <span className="row" style={{ minWidth: 0 }}>
                                <span className="person__dot" style={{ background: personColor(w.color, i) }} />
                                <span className="truncate">{w.person}</span>
                            </span>
                            <span className="workload__bar"><span style={{ width: `${(w.count / max) * 100}%`, background: personColor(w.color, i) }} /></span>
                            <span className="mono right">{w.count}</span>
                        </div>
                    );
                })}
            </div>
        </Panel>
    );

    const callListPanel = data.callList && (
        <Panel title={t('home.toCall')} icon="call" flush className="calls" actions={<span className="t-caption secondary">{plural(data.callList.total, 'flat')} · {data.callList.calledNoAppointment} {t('home.calledNoAppointment').toLowerCase()}</span>}>
            {data.callList.items.length === 0 ? (
                <EmptyState icon="call" title="Niets te bellen" text="Elke flat heeft een technische afspraak." />
            ) : (
                <div className="table-wrap--scroll">
                    <table className="table table--dense">
                        <thead>
                            <tr>
                                <th>Flat</th>
                                <th className="hide-narrow">District</th>
                                <th>{t('flat.phone')}</th>
                                <th className="hide-mobile">{t('flat.called')}</th>
                                <th className="hide-narrow">SMS</th>
                                <th>Gereed</th>
                                <th aria-label="Acties" />
                            </tr>
                        </thead>
                        <tbody>
                            {data.callList.items.slice(0, 10).map((row) => (
                                <tr key={row.flat._id}>
                                    <td>
                                        <span className="col" style={{ alignItems: 'flex-start', gap: 2 }}>
                                            <Link to={`/apartment/${row.flat._id}`} className="nowrap" style={{ color: 'inherit', fontWeight: 600 }}>{flatName(row.flat)}</Link>
                                            {row.flat.zoeksleutel && <KeyChip>{row.flat.zoeksleutel}</KeyChip>}
                                        </span>
                                    </td>
                                    <td className="hide-narrow t-caption secondary nowrap">{row.districtName ?? '—'}{row.districtPriority ? <span className="mono muted"> #{row.districtPriority}</span> : null}</td>
                                    <td className="mono">{row.telephone ? <a href={telHref(row.telephone)}>{fmtPhone(row.telephone)}</a> : <span className="muted">Onbekend</span>}</td>
                                    <td className="hide-mobile t-caption nowrap">{row.timesCalled > 0 ? `${row.timesCalled}× · ${fmtDayMonth(row.lastCalled)}` : 'Nog niet'}</td>
                                    <td className="hide-narrow t-caption">{row.smsSent ? 'Verstuurd' : '—'}</td>
                                    <td>
                                        <span className={`status-text status-text--${row.readyForSchouwer ? 'done' : 'none'}`}>
                                            <Icon name={row.readyForSchouwer ? 'check_circle' : 'radio_button_unchecked'} />
                                            {row.readyForSchouwer ? t('common.yes') : t('common.no')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <LinkButton to={scheduleFlatHref(row.flat._id, 'Technical')} variant="accent" size="dense" icon="event">{t('common.schedule')}</LinkButton>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data.callList.items.length > 10 && (
                        <div className="table__footer"><span>Eerste 10 van {data.callList.total} · op prioriteit van district</span><Link to="/districts" className="ml-auto">{t('common.showAll')}</Link></div>
                    )}
                </div>
            )}
        </Panel>
    );

    const signedPanel = data.signedWithoutHas && (
        <Panel title={`${data.signedWithoutHas.total} ${t('home.signedNoHas')}`} icon="draw" flush>
            {data.signedWithoutHas.items.length === 0 ? (
                <EmptyState icon="draw" title="Geen wachtrij" text="Elke getekende schouw heeft een HAS-afspraak." />
            ) : (
                <div className="list">
                    {data.signedWithoutHas.items.slice(0, 8).map((row) => (
                        <div key={row.flat._id} className="list__item">
                            <Icon name="door_front" className="muted" />
                            <span className="list__body">
                                <Link to={`/apartment/${row.flat._id}`} className="list__title" style={{ color: 'inherit' }}>{flatName(row.flat)}</Link>
                                <span className="list__meta">{[row.signedAt ? `Getekend ${fmtDayMonth(row.signedAt)}` : null, row.team, row.flat.complexNaam].filter(Boolean).join(' · ')}</span>
                            </span>
                            <LinkButton to={scheduleFlatHref(row.flat._id, 'HAS')} variant="accent" size="dense" icon="event">{t('flat.scheduleHas')}</LinkButton>
                        </div>
                    ))}
                    {data.signedWithoutHas.total > 8 && <div className="table__footer"><span>Eerste 8 van {data.signedWithoutHas.total}</span><Link to="/has-agenda" className="ml-auto">{t('nav.hasAgenda')}</Link></div>}
                </div>
            )}
        </Panel>
    );

    const layoutPanel = data.buildingsWithoutLayout && (
        <Panel title={`${data.buildingsWithoutLayout.total} gebouwen ${t('home.withoutLayout')}`} icon="architecture" flush>
            {data.buildingsWithoutLayout.items.length === 0 ? (
                <EmptyState icon="architecture" title="Alle gebouwen hebben een plattegrond" />
            ) : (
                <div className="list">
                    {data.buildingsWithoutLayout.items.slice(0, 6).map((b) => (
                        <div key={b._id} className="list__item">
                            <Icon name="apartment" className="muted" />
                            <span className="list__body">
                                <Link to={`/building/${b._id}`} className="list__title" style={{ color: 'inherit' }}>{b.address}</Link>
                                <span className="list__meta">{[b.district, plural(b.flats, 'flat'), b.postcode].filter(Boolean).join(' · ')}</span>
                            </span>
                            <LinkButton to={`/building/${b._id}`} variant="secondary" size="dense" icon="architecture">{t('home.makeLayout')}</LinkButton>
                        </div>
                    ))}
                    {data.buildingsWithoutLayout.total > 6 && <div className="table__footer"><span>Eerste 6 van {data.buildingsWithoutLayout.total} · op prioriteit van district</span><Link to="/districts" className="ml-auto">{t('common.showAll')}</Link></div>}
                </div>
            )}
        </Panel>
    );

    const blockedPanel = data.blockedBuildings && data.blockedBuildings.length > 0 && (
        <Panel title={`${data.blockedBuildings.length} ${data.blockedBuildings.length === 1 ? t('home.blockedBuildings') : t('home.blockedBuildingsPlural')}`} icon="block" flush>
            <div className="list">
                {data.blockedBuildings.map((b) => (
                    <Link key={b._id} to={`/building/${b._id}`} className="list__item">
                        <Icon name="block" style={{ color: 'var(--status-blocked-fg)' }} />
                        <span className="list__body">
                            <span className="list__title">{b.address}</span>
                            <span className="list__meta">{[b.blockReason, b.blockedBy, b.blockedAt ? daysAgo(b.blockedAt) : null].filter(Boolean).join(' · ')}</span>
                        </span>
                        <Icon name="chevron_right" className="chev" />
                    </Link>
                ))}
            </div>
        </Panel>
    );

    // Field worker: today's route.
    if (fieldOnly && data.mine) {
        const mine = data.mine;
        const color = personColor(data.user.color, 0);
        const later = mine.week.filter((a) => !mine.today.includes(a) && !mine.tomorrow.includes(a));
        return (
            <div className="page">
                <header className="page__header">
                    <div className="page__title-block">
                        <h1 className="t-title-l">{t(greeting())}, {name}</h1>
                        <p className="page__subtitle t-small">{plural(mine.today.length, 'afspraak', 'afspraken')} vandaag · wk {week}</p>
                    </div>
                </header>
                <section className="col gap-2">
                    <h2 className="t-title-s">{t('common.today')}</h2>
                    {mine.today.length === 0 ? <EmptyState icon="event_available" title={t('home.empty.today')} /> : <div className="today">{mine.today.map((a) => <AppointmentCard key={`${a.kind}-${a.flat._id}`} a={a} color={color} />)}</div>}
                </section>
                {mine.tomorrow.length > 0 && (
                    <section className="col gap-2">
                        <h2 className="t-title-s">{t('common.tomorrow')}</h2>
                        <div className="today">{mine.tomorrow.map((a) => <AppointmentCard key={`${a.kind}-${a.flat._id}`} a={a} color={color} />)}</div>
                    </section>
                )}
                {later.length > 0 && (
                    <section className="col gap-2">
                        <h2 className="t-title-s">Later deze week</h2>
                        <div className="today">{later.map((a) => (
                            <div key={`${a.kind}-${a.flat._id}`} className="today__item">
                                <span className="today__bar" style={{ background: color }} />
                                <span className="col">
                                    <span className="today__time">{fmtDayMonth(a.date)} · {fmtRange(a.startTime, a.endTime)}</span>
                                    <Link to={`/apartment/${a.flat._id}`} className="today__where" style={{ color: 'inherit' }}>{flatName(a.flat)}</Link>
                                </span>
                                <Link to={`/apartment/${a.flat._id}`} className="btn btn--ghost btn--dense btn--icon" aria-label={t('common.open')}><Icon name="chevron_right" /></Link>
                            </div>
                        ))}</div>
                    </section>
                )}
            </div>
        );
    }

    return (
        <div className="page">
            <header className="page__header">
                <div className="page__title-block">
                    <h1 className="t-title-l">{t(greeting())}, {name}</h1>
                    {ov ? (
                        <p className="page__subtitle t-small">wk {week} · {ov.cities} steden · {ov.areas} gebieden · {ov.districts} districten · {ov.buildings} gebouwen · {ov.flats} flats</p>
                    ) : (
                        <p className="page__subtitle t-small">wk {week}</p>
                    )}
                </div>
            </header>

            {ov && (
                <div className="home__kpis">
                    <Stat label={t('home.stat.completed')} value={ov.completed} unit={`van ${ov.flats} flats`} percent={ov.flats ? (ov.completed / ov.flats) * 100 : 0} />
                    <Stat label={t('home.stat.inProgress')} value={ov.inProgress} unit={ov.flats ? fmtPercent((ov.inProgress / ov.flats) * 100, 0) : undefined} percent={ov.flats ? (ov.inProgress / ov.flats) * 100 : 0} tone="warn" />
                    <Stat label={t('home.stat.thisWeek')} value={ov.scheduledThisWeek} unit={`wk ${week}`} percent={ov.flats ? (ov.scheduledThisWeek / ov.flats) * 100 : 0} tone="info" />
                    <Stat label={t('home.stat.noAppointment')} value={ov.withoutAppointment} unit={data.callList ? `${data.callList.calledNoAppointment} al gebeld` : undefined} percent={ov.flats ? (ov.withoutAppointment / ov.flats) * 100 : 0} tone="none" />
                    <Stat label={t('home.stat.blocked')} value={ov.blocked} unit={ov.blocked === 1 ? 'gebouw' : 'gebouwen'} percent={ov.buildings ? (ov.blocked / ov.buildings) * 100 : 0} tone="danger" />
                </div>
            )}

            <div className="home__cols">
                <div className="col gap-4">
                    {data.attention && (
                        <Panel title={t('home.attention')} icon="priority_high" flush actions={<span className="t-caption secondary">{t('home.attention.sub')}</span>}>
                            {data.attention.length === 0 ? (
                                <EmptyState icon="check_circle" title="Niets vraagt aandacht" text="Geen blokkades, overlappende afspraken of wachtrijen." />
                            ) : (
                                <div className="attention">
                                    {data.attention.map((a, i) => {
                                        const meta = ATTENTION_ICON[a.kind] ?? { icon: 'info', color: 'var(--text-muted)' };
                                        const href = a.kind === 'blocked' && a.buildingId ? `/building/${a.buildingId}` : a.kind === 'import' ? '/district-management' : a.kind === 'overlap' ? '/appointment-validator' : a.kind === 'signedNoHas' ? '/has-agenda' : a.kind === 'userNoRole' ? '/admin' : undefined;
                                        const action = a.kind === 'blocked' ? 'Bekijken' : a.kind === 'import' ? 'Importeren' : a.kind === 'overlap' ? 'Oplossen' : a.kind === 'signedNoHas' ? 'Naar lijst' : 'Toewijzen';
                                        return (
                                            <div key={`${a.kind}-${i}`} className="attention__item">
                                                <Icon name={meta.icon} style={{ color: meta.color }} />
                                                <span className="attention__body">
                                                    <span className="attention__title">{a.title}</span>
                                                    {a.detail && <span className="attention__sub">{a.detail}</span>}
                                                </span>
                                                <span className="attention__meta hide-mobile">{[a.meta, a.date ? daysAgo(a.date) : null].filter(Boolean).join(' · ')}</span>
                                                {href && <LinkButton to={href} variant="secondary" size="dense">{action}</LinkButton>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Panel>
                    )}
                    {data.pipeline && (
                        <Panel title={t('home.pipeline')} icon="conveyor_belt">
                            <div className="pipeline">
                                {data.pipeline.map((p, i) => (
                                    <React.Fragment key={p.key}>
                                        <div className="pipeline__stage">
                                            <Icon name={PIPELINE_LABELS[p.key]?.icon ?? 'circle'} />
                                            <span className="pipeline__label">{PIPELINE_LABELS[p.key]?.label ?? p.key}</span>
                                            <span className="pipeline__n">{p.count}</span>
                                        </div>
                                        {i < data.pipeline!.length - 1 && <Icon name="arrow_forward" className="pipeline__arrow" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </Panel>
                    )}
                    {callListPanel}
                    {signedPanel}
                    {layoutPanel}
                </div>
                <div className="col gap-4">
                    {districtsPanel}
                    {workloadPanel}
                    {blockedPanel}
                    {has(ROLES.ADMIN) && (
                        <Panel title="Snel naar" icon="bolt">
                            <div className="col gap-2">
                                <LinkButton to="/district-management" variant="secondary" icon="upload_file" block>{t('home.importDistrict')}</LinkButton>
                                <LinkButton to="/dashboard" variant="secondary" icon="low_priority" block>{t('priority.title')}</LinkButton>
                                <LinkButton to="/appointment-validator" variant="secondary" icon="fact_check" block>{t('validator.title')}</LinkButton>
                            </div>
                        </Panel>
                    )}
                    {data.attention?.some((a) => a.kind === 'signedNoHas') && !data.signedWithoutHas && (
                        <Pill family="planned" icon="draw">{data.attention.find((a) => a.kind === 'signedNoHas')?.title}</Pill>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
