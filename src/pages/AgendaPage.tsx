// Planningsagenda (technical surveys) and HAS-agenda (installations) on react-big-calendar.
// Week view by default, month/day/list available; person legend filters; event colour is
// the person's colour, the type is conveyed by a glyph so colour is never the only cue.

import React, { useCallback, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, Views, EventProps, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, differenceInMinutes, isSameMonth, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { usePersonnel } from '../hooks/usePersonnel';
import { useIsPhone } from '../hooks/useMediaQuery';
import { usePageChrome } from '../components/shell/ShellContext';
import { usePersistedState } from '../hooks/usePersistedState';
import { ROLES } from '../utils/constants';
import { t } from '../i18n';
import { fmtDate, fmtRange, fmtWeekday, fmtPhone, telHref, isoWeek, mapsHref } from '../utils/format';
import { hasTypeStatus, personColor } from '../utils/status';
import { unwrapList, PaginatedResponse, flatLabel } from '../types/domain';
import { Button, IconButton, Segmented, Panel, KV, Modal, Icon, ErrorState, SkeletonRows, EmptyState, Pill } from '../components/ui';

interface FlatAppointment {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    complexNaam?: string;
    postcode?: string;
    technischePlanning?: { appointmentBooked?: { date?: string; startTime?: string; endTime?: string; weekNumber?: number }; technischeSchouwerName?: string; telephone?: string; additionalNotes?: string };
    hasMonteur?: { appointmentBooked?: { date?: string; startTime?: string; endTime?: string; weekNumber?: number; type?: string; complaintDetails?: string }; hasMonteurName?: string; installation?: { status?: string } };
}

export interface AgendaEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    person: string;
    kind: 'technical' | 'has';
    type: string;
    flat: FlatAppointment;
    phone?: string;
    notes?: string;
    weekNumber?: number;
}

interface AgendaPageProps {
    calendarType: 'TECHNICAL' | 'HAS';
}

const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (d: Date) => startOfWeek(d, { locale: nl }), getDay, locales: { nl } });

const toEvents = (items: FlatAppointment[], kind: 'technical' | 'has'): AgendaEvent[] =>
    items.flatMap((flat) => {
        const doc = kind === 'has' ? flat.hasMonteur : flat.technischePlanning;
        const appt = doc?.appointmentBooked;
        if (!appt?.date || !appt.startTime) return [];
        const day = new Date(appt.date);
        if (Number.isNaN(day.getTime())) return [];
        const [sh, sm] = appt.startTime.split(':').map(Number);
        const [eh, em] = (appt.endTime || `${sh + 1}:${sm}`).split(':').map(Number);
        const start = new Date(day); start.setHours(sh, sm || 0, 0, 0);
        const end = new Date(day); end.setHours(eh, em || 0, 0, 0);
        if (differenceInMinutes(end, start) < 15) end.setMinutes(start.getMinutes() + 30);
        const address = flatLabel(flat);
        return [{
            id: flat._id,
            title: address || flat.complexNaam || flat._id,
            start,
            end,
            person: (kind === 'has' ? flat.hasMonteur?.hasMonteurName : flat.technischePlanning?.technischeSchouwerName) || '',
            kind,
            type: kind === 'has' ? (appt as { type?: string }).type || 'HAS' : 'Schouw',
            flat,
            phone: flat.technischePlanning?.telephone,
            notes: kind === 'has' ? (appt as { complaintDetails?: string }).complaintDetails : flat.technischePlanning?.additionalNotes,
            weekNumber: appt.weekNumber,
        }];
    });

const eventIcon = (e: AgendaEvent) => (e.kind === 'technical' ? 'search_check' : hasTypeStatus(e.type).icon);

const AgendaPage: React.FC<AgendaPageProps> = ({ calendarType }) => {
    const kind = calendarType === 'HAS' ? 'has' : 'technical';
    const navigate = useNavigate();
    const { auth } = useAuth();
    const roles = auth.roles ?? [];
    const isPhone = useIsPhone();
    const fieldOnly = roles.some((r) => r === ROLES.TECHNICAL_INSPECTOR || r === ROLES.HAS_MONTEUR) && !roles.some((r) => r === ROLES.ADMIN || r === ROLES.TECHNICAL_PLANNING || r === ROLES.HAS_PLANNING);
    const title = kind === 'has' ? t('agenda.has') : t('agenda.technical');
    usePageChrome([{ label: title }], title);

    const endpoint = kind === 'has' ? '/api/apartment/appointments/all-hasmonteur' : '/api/apartment/appointments/all-technischeplanning';
    const { data, loading, error, reload } = useApi<PaginatedResponse<FlatAppointment> | FlatAppointment[]>(endpoint, { params: { limit: 1000, sortBy: 'appointmentBooked.date', sortOrder: 'asc' } });
    const { people, colorOf } = usePersonnel(kind === 'has' ? 'HASMonteur' : 'TechnischeSchouwer');

    const events = useMemo(() => toEvents(unwrapList<FlatAppointment>(data ?? undefined), kind), [data, kind]);
    const [person, setPerson] = useState<string>(() => (fieldOnly && auth.name ? auth.name : ''));
    const [view, setView] = usePersistedState<View>(`dynet.agendaView.${kind}`, isPhone ? Views.AGENDA : Views.WEEK);
    const [date, setDate] = useState<Date>(new Date());
    const [selected, setSelected] = useState<AgendaEvent | null>(null);

    const names = useMemo(() => {
        const set = new Map<string, number>();
        people.forEach((p) => set.set(p.name || '', 0));
        events.forEach((e) => { if (e.person) set.set(e.person, (set.get(e.person) || 0) + 1); });
        return Array.from(set.entries()).filter(([n]) => n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    }, [people, events]);

    const colourIndex = useCallback((name: string) => Math.max(0, names.findIndex(([n]) => n === name)), [names]);
    const colourFor = useCallback((name: string) => personColor(colorOf(name), colourIndex(name)), [colorOf, colourIndex]);

    const visible = useMemo(() => (person ? events.filter((e) => e.person === person) : events), [events, person]);

    const eventPropGetter = useCallback((e: AgendaEvent) => {
        const c = colourFor(e.person);
        return { style: { ['--event-color' as string]: c, ['--event-bg' as string]: `${c}1F` } as React.CSSProperties };
    }, [colourFor]);

    const components = useMemo(() => {
        const EventChip: React.FC<EventProps<AgendaEvent>> = ({ event }) => (
            <span className="event-chip" title={`${event.title} · ${event.person}`}>
                <span className="event-chip__head">
                    <Icon name={eventIcon(event)} />
                    <span className="event-chip__title">{event.title}</span>
                </span>
                {view !== Views.MONTH && <span className="event-chip__meta">{event.person}</span>}
            </span>
        );
        const Toolbar: React.FC<ToolbarProps<AgendaEvent>> = ({ onNavigate, label }) => (
            <div className="agenda__toolbar">
                <IconButton icon="chevron_left" label="Vorige" onClick={() => onNavigate('PREV')} />
                <IconButton icon="chevron_right" label="Volgende" onClick={() => onNavigate('NEXT')} />
                <Button variant="secondary" size="dense" onClick={() => onNavigate('TODAY')}>{t('common.today')}</Button>
                <span className="agenda__range">{label}{view === Views.WEEK ? ` · wk ${isoWeek(date)}` : ''}</span>
                <span className="ml-auto">
                    <Segmented
                        value={view}
                        onChange={(v) => setView(v as View)}
                        aria-label="Weergave"
                        options={[
                            { value: Views.MONTH, label: t('agenda.month') },
                            { value: Views.WEEK, label: t('agenda.week') },
                            { value: Views.DAY, label: t('agenda.day') },
                            { value: Views.AGENDA, label: t('agenda.list') },
                        ]}
                    />
                </span>
            </div>
        );
        return { event: EventChip, toolbar: Toolbar };
    }, [view, date, setView]);

    const counts = useMemo(() => {
        const inRange = view === Views.MONTH ? visible.filter((e) => isSameMonth(e.start, date)) : visible;
        const c = { survey: 0, has: 0, fault: 0, complaint: 0 };
        inRange.forEach((e) => {
            if (e.kind === 'technical') c.survey += 1;
            else if (e.type === 'Storing') c.fault += 1;
            else if (e.type === 'Complaint') c.complaint += 1;
            else c.has += 1;
        });
        return c;
    }, [visible, view, date]);

    const upcomingList = useMemo(() => {
        const from = new Date(); from.setHours(0, 0, 0, 0);
        const to = addDays(from, 14);
        const list = visible.filter((e) => e.start >= from && e.start < to).sort((a, b) => a.start.getTime() - b.start.getTime());
        const groups = new Map<string, AgendaEvent[]>();
        list.forEach((e) => { const k = fmtWeekday(e.start); groups.set(k, [...(groups.get(k) || []), e]); });
        return Array.from(groups.entries());
    }, [visible]);

    if (loading && !data) return <SkeletonRows rows={6} />;
    if (error && !data) return <ErrorState onRetry={reload} />;

    const legend = (
        <Panel title={kind === 'has' ? t('agenda.installers') : t('agenda.surveyors')} icon="group">
            <div className="agenda__people">
                <button type="button" className={`person-row ${person === '' ? 'is-active' : ''}`.trim()} onClick={() => setPerson('')}>
                    <span className="person__dot" style={{ background: 'var(--border-strong)' }} />
                    <span>{t('common.all')}</span>
                    <span className="person-row__count">{events.length}</span>
                </button>
                {names.map(([n, count]) => (
                    <button key={n} type="button" className={`person-row ${person === n ? 'is-active' : ''}`.trim()} onClick={() => setPerson(person === n ? '' : n)}>
                        <span className="person__dot" style={{ background: colourFor(n) }} />
                        <span className="truncate">{n}</span>
                        <span className="person-row__count">{count}</span>
                    </button>
                ))}
            </div>
            <p className="t-caption muted" style={{ marginTop: 8 }}>{t('agenda.personHint')}</p>
            <div className="col gap-1" style={{ marginTop: 12 }}>
                {kind === 'technical' ? (
                    <span className="row t-caption secondary"><Icon name="search_check" size="dense" /> {counts.survey} {t('agenda.surveys')}</span>
                ) : (
                    <>
                        <span className="row t-caption secondary"><Icon name="construction" size="dense" /> {counts.has} {t('agenda.installs')}</span>
                        <span className="row t-caption secondary"><Icon name="bolt" size="dense" /> {counts.fault} {t('agenda.faults')}</span>
                        <span className="row t-caption secondary"><Icon name="flag" size="dense" /> {counts.complaint} {t('agenda.complaints')}</span>
                    </>
                )}
            </div>
        </Panel>
    );

    return (
        <div className="page">
            <header className="page__header">
                <div className="page__title-block">
                    <h1 className="t-title-l">{title}</h1>
                    <p className="page__subtitle t-small">{events.length} afspraken · {names.length} {kind === 'has' ? 'monteurs' : 'schouwers'}</p>
                </div>
            </header>

            {isPhone && (
                <div className="chips chips--scroll">
                    <button type="button" className={`chip ${person === '' ? 'chip--active' : ''}`.trim()} onClick={() => setPerson('')}>{t('common.all')}</button>
                    {names.map(([n, count]) => (
                        <button key={n} type="button" className={`chip ${person === n ? 'chip--active' : ''}`.trim()} onClick={() => setPerson(person === n ? '' : n)}>
                            <span className="person__dot" style={{ background: colourFor(n) }} />{n}<span className="chip__count">{count}</span>
                        </button>
                    ))}
                </div>
            )}

            {isPhone && view === Views.AGENDA ? (
                <div className="agenda-list">
                    <div className="row">
                        <Segmented value="list" onChange={() => setView(Views.DAY)} options={[{ value: 'list', label: t('agenda.list') }, { value: 'cal', label: t('agenda.day') }]} />
                    </div>
                    {upcomingList.length === 0 && <EmptyState icon="event_busy" title={t('agenda.empty')} />}
                    {upcomingList.map(([day, list]) => (
                        <div key={day} className="col gap-2">
                            <div className="agenda-list__day">{day}</div>
                            {list.map((e) => (
                                <button key={`${e.id}-${e.start.getTime()}`} type="button" className="today__item" style={{ textAlign: 'left' }} onClick={() => setSelected(e)}>
                                    <span className="today__bar" style={{ background: colourFor(e.person) }} />
                                    <span className="col">
                                        <span className="today__time">{format(e.start, 'HH:mm')}–{format(e.end, 'HH:mm')}</span>
                                        <span className="today__where">{e.title}</span>
                                        <span className="today__who">{e.kind === 'has' ? hasTypeStatus(e.type).label : t('agenda.survey')} · {e.person}</span>
                                    </span>
                                    <Icon name="chevron_right" className="muted" />
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`agenda ${isPhone ? '' : ''}`.trim()}>
                    <div className="agenda__cal">
                        <Calendar<AgendaEvent>
                            localizer={localizer}
                            culture="nl"
                            events={visible}
                            view={view}
                            onView={(v) => setView(v)}
                            date={date}
                            onNavigate={(d) => setDate(d)}
                            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                            min={new Date(1970, 0, 1, 7, 0)}
                            max={new Date(1970, 0, 1, 19, 0)}
                            step={30}
                            timeslots={2}
                            popup
                            onSelectEvent={(e) => setSelected(e)}
                            eventPropGetter={eventPropGetter}
                            components={components}
                            style={{ height: isPhone ? 'calc(100vh - 260px)' : 'calc(100vh - 220px)', minHeight: 520 }}
                            messages={{ today: t('common.today'), previous: 'Vorige', next: 'Volgende', month: t('agenda.month'), week: t('agenda.week'), day: t('agenda.day'), agenda: t('agenda.list'), noEventsInRange: t('agenda.empty'), showMore: (n) => `+${n} meer`, date: 'Datum', time: 'Tijd', event: 'Afspraak' }}
                        />
                    </div>
                    {!isPhone && legend}
                </div>
            )}

            <Modal
                open={!!selected}
                onClose={() => setSelected(null)}
                title={selected?.title}
                subtitle={selected ? `${selected.kind === 'has' ? hasTypeStatus(selected.type).label : t('agenda.survey')} · ${selected.person}` : undefined}
                footer={
                    selected && (
                        <>
                            {selected.phone && <a className="btn btn--secondary" href={telHref(selected.phone)}><Icon name="call" /><span>{fmtPhone(selected.phone)}</span></a>}
                            <a className="btn btn--secondary" href={mapsHref(selected.title, selected.flat.postcode)} target="_blank" rel="noreferrer"><Icon name="near_me" /><span>{t('home.route')}</span></a>
                            <Button variant="primary" icon="door_front" onClick={() => { navigate(`/apartment/${selected.id}`); setSelected(null); }}>{t('agenda.openFlat')}</Button>
                        </>
                    )
                }
            >
                {selected && (
                    <>
                        <div className="row">
                            <span className="person__dot" style={{ background: colourFor(selected.person) }} />
                            <span className="t-small">{selected.person}</span>
                            <Pill family={selected.kind === 'has' ? hasTypeStatus(selected.type).family : 'planned'} icon={eventIcon(selected)}>{selected.kind === 'has' ? hasTypeStatus(selected.type).label : 'Schouw'}</Pill>
                        </div>
                        <KV
                            rows={[
                                { label: t('agenda.when'), value: `${fmtDate(selected.start)} · wk ${selected.weekNumber ?? isoWeek(selected.start)}`, mono: true },
                                { label: t('agenda.time'), value: fmtRange(format(selected.start, 'HH:mm'), format(selected.end, 'HH:mm')), mono: true },
                                { label: 'Complex', value: selected.flat.complexNaam },
                                { label: t('flat.postcode'), value: selected.flat.postcode, mono: true },
                                { label: t('flat.notes'), value: selected.notes },
                            ]}
                        />
                    </>
                )}
            </Modal>
        </div>
    );
};

export default AgendaPage;
