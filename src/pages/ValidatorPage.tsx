// Appointment validation (Admin): a handful of consistency checks over every appointment,
// run in the browser against the same endpoints the agendas use.

import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosPrivate from '../api/axios';
import { usePageChrome } from '../components/shell/ShellContext';
import { usePersistedState } from '../hooks/usePersistedState';
import { t } from '../i18n';
import { fmtDateTime, fmtDayMonth, fmtRange, isoWeek } from '../utils/format';
import { unwrapList, PaginatedResponse, flatLabel } from '../types/domain';
import { Button, Icon, Pill, EmptyState } from '../components/ui';

interface Appt {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    technischePlanning?: { appointmentBooked?: { date?: string; startTime?: string; endTime?: string; weekNumber?: number }; technischeSchouwerName?: string };
    hasMonteur?: { appointmentBooked?: { date?: string; startTime?: string; endTime?: string; weekNumber?: number; type?: string }; hasMonteurName?: string };
}

type State = 'PASS' | 'WARN' | 'FAIL';
interface Check {
    state: State;
    name: string;
    detail: string;
    links?: Array<{ label: string; to: string }>;
}

interface Run {
    at: string;
    checks: Check[];
}

const name = (a: Appt) => flatLabel(a) || a._id;
const toMin = (v?: string) => { if (!v) return NaN; const [h, m] = v.split(':').map(Number); return h * 60 + (m || 0); };

const ValidatorPage: React.FC = () => {
    usePageChrome([{ label: t('validator.title') }], t('validator.title'));
    const [run, setRun] = usePersistedState<Run | null>('dynet.validatorRun', null);
    const [running, setRunning] = useState(false);

    const execute = useCallback(async () => {
        setRunning(true);
        const checks: Check[] = [];
        const timed = async <T,>(fn: () => Promise<T>): Promise<[T, number]> => { const s = performance.now(); const r = await fn(); return [r, Math.round(performance.now() - s)]; };
        try {
            const [tech, tMs] = await timed(() => axiosPrivate.get<PaginatedResponse<Appt> | Appt[]>('/api/apartment/appointments/all-technischeplanning', { params: { limit: 1000 } }).then((r) => unwrapList<Appt>(r.data)));
            checks.push({ state: 'PASS', name: 'Technische afspraken ophalen', detail: `${tech.length} afspraken · ${tMs} ms` });
            const [has, hMs] = await timed(() => axiosPrivate.get<PaginatedResponse<Appt> | Appt[]>('/api/apartment/appointments/all-hasmonteur', { params: { limit: 1000 } }).then((r) => unwrapList<Appt>(r.data)));
            checks.push({ state: 'PASS', name: 'HAS-afspraken ophalen', detail: `${has.length} afspraken · ${hMs} ms` });

            type Norm = { id: string; who: string; kind: string; date: string; start?: string; end?: string; week?: number; label: string };
            const all: Norm[] = [
                ...tech.map((a) => ({ id: a._id, who: a.technischePlanning?.technischeSchouwerName || '', kind: 'Schouw', date: a.technischePlanning?.appointmentBooked?.date || '', start: a.technischePlanning?.appointmentBooked?.startTime, end: a.technischePlanning?.appointmentBooked?.endTime, week: a.technischePlanning?.appointmentBooked?.weekNumber, label: name(a) })),
                ...has.map((a) => ({ id: a._id, who: a.hasMonteur?.hasMonteurName || '', kind: a.hasMonteur?.appointmentBooked?.type || 'HAS', date: a.hasMonteur?.appointmentBooked?.date || '', start: a.hasMonteur?.appointmentBooked?.startTime, end: a.hasMonteur?.appointmentBooked?.endTime, week: a.hasMonteur?.appointmentBooked?.weekNumber, label: name(a) })),
            ];

            // Structure
            const broken = all.filter((a) => !a.date || Number.isNaN(new Date(a.date).getTime()) || !a.start || !a.end);
            checks.push(broken.length === 0
                ? { state: 'PASS', name: 'Datastructuur afspraken', detail: 'Alle velden aanwezig (datum, start, eind)' }
                : { state: 'FAIL', name: 'Datastructuur afspraken', detail: `${broken.length} afspraken missen datum of tijd`, links: broken.slice(0, 5).map((b) => ({ label: b.label, to: `/apartment/${b.id}` })) });

            // End after start
            const inverted = all.filter((a) => a.start && a.end && toMin(a.end) <= toMin(a.start));
            checks.push(inverted.length === 0
                ? { state: 'PASS', name: 'Eindtijd na starttijd', detail: `${all.length} van ${all.length}` }
                : { state: 'FAIL', name: 'Eindtijd na starttijd', detail: `${inverted.length} afspraken eindigen voor ze beginnen`, links: inverted.slice(0, 5).map((b) => ({ label: `${b.label} · ${fmtRange(b.start, b.end)}`, to: `/apartment/${b.id}` })) });

            // Week number
            const wrongWeek = all.filter((a) => a.date && a.week && isoWeek(a.date) !== a.week);
            checks.push(wrongWeek.length === 0
                ? { state: 'PASS', name: 'Weeknummer komt overeen met datum', detail: `${all.filter((a) => a.week).length} gecontroleerd` }
                : { state: 'WARN', name: 'Weeknummer komt overeen met datum', detail: `${wrongWeek.length} afspraken: opgeslagen weeknummer wijkt af van de datum`, links: wrongWeek.slice(0, 5).map((b) => ({ label: `${b.label} · wk ${b.week} opgeslagen, datum valt in wk ${isoWeek(b.date)}`, to: `/apartment/${b.id}` })) });

            // Overlaps per person per day
            const byKey = new Map<string, Norm[]>();
            all.forEach((a) => { if (!a.who || !a.date) return; const k = `${a.kind === 'Schouw' ? 'T' : 'H'}|${a.who}|${a.date.slice(0, 10)}`; byKey.set(k, [...(byKey.get(k) || []), a]); });
            const overlaps: Array<[Norm, Norm]> = [];
            byKey.forEach((list) => {
                const sorted = [...list].sort((x, y) => toMin(x.start) - toMin(y.start));
                for (let i = 1; i < sorted.length; i++) if (toMin(sorted[i].start) < toMin(sorted[i - 1].end)) overlaps.push([sorted[i - 1], sorted[i]]);
            });
            checks.push(overlaps.length === 0
                ? { state: 'PASS', name: 'Geen overlappende afspraken per persoon', detail: `${byKey.size} persoon-dagen gecontroleerd` }
                : { state: 'FAIL', name: 'Geen overlappende afspraken per persoon', detail: `${overlaps.length} overlappingen`, links: overlaps.slice(0, 6).map(([a, b]) => ({ label: `${a.who} · ${fmtDayMonth(a.date)} ${fmtRange(a.start, a.end)} ↔ ${fmtRange(b.start, b.end)} (${b.label})`, to: `/apartment/${b.id}` })) });

            // Person + colour
            const users = unwrapList<{ name?: string; color?: string }>((await axiosPrivate.get('/api/users', { params: { limit: 500 } })).data);
            const known = new Map(users.map((u) => [u.name || '', u.color]));
            const noPerson = all.filter((a) => !a.who);
            const unknownPerson = all.filter((a) => a.who && !known.has(a.who));
            const noColour = all.filter((a) => a.who && known.has(a.who) && !known.get(a.who));
            const problems = noPerson.length + unknownPerson.length + noColour.length;
            checks.push(problems === 0
                ? { state: 'PASS', name: 'Agenda-events hebben een persoon en kleur', detail: `${all.length} van ${all.length}` }
                : { state: 'WARN', name: 'Agenda-events hebben een persoon en kleur', detail: [noPerson.length ? `${noPerson.length} zonder persoon` : '', unknownPerson.length ? `${unknownPerson.length} met onbekende persoon` : '', noColour.length ? `${noColour.length} persoon zonder kleur` : ''].filter(Boolean).join(' · '), links: [...noPerson, ...unknownPerson].slice(0, 5).map((b) => ({ label: `${b.label}${b.who ? ` · ${b.who}` : ''}`, to: `/apartment/${b.id}` })) });

            // Past appointments still open (HAS not completed)
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const stale = has.filter((a) => a.hasMonteur?.appointmentBooked?.date && new Date(a.hasMonteur.appointmentBooked.date) < today && (a.hasMonteur as { installation?: { status?: string } }).installation?.status !== 'completed');
            checks.push(stale.length === 0
                ? { state: 'PASS', name: 'HAS-afspraken in het verleden zijn afgerond', detail: 'Geen open installaties met een verstreken datum' }
                : { state: 'WARN', name: 'HAS-afspraken in het verleden zijn afgerond', detail: `${stale.length} verstreken installaties zonder oplevering`, links: stale.slice(0, 5).map((b) => ({ label: `${name(b)} · ${fmtDayMonth(b.hasMonteur?.appointmentBooked?.date)}`, to: `/apartment/${b._id}` })) });
        } catch (err) {
            checks.push({ state: 'FAIL', name: 'Validatie afgebroken', detail: (err as Error).message || 'Onbekende fout' });
        }
        setRun({ at: new Date().toISOString(), checks });
        setRunning(false);
    }, [setRun]);

    const counts = run ? { pass: run.checks.filter((c) => c.state === 'PASS').length, warn: run.checks.filter((c) => c.state === 'WARN').length, fail: run.checks.filter((c) => c.state === 'FAIL').length } : null;

    return (
        <div className="page">
            <header className="page__header">
                <div className="page__title-block">
                    <h1 className="t-title-l">{t('validator.title')}</h1>
                    <p className="page__subtitle t-small">
                        {run && counts ? t('validator.summary', { n: run.checks.length, when: fmtDateTime(run.at), ...counts }) : t('validator.never')}
                    </p>
                </div>
                <div className="page__actions">
                    <Button variant="primary" icon="play_arrow" onClick={execute} loading={running}>{run ? t('validator.run') : 'Uitvoeren'}</Button>
                </div>
            </header>

            {!run ? (
                <EmptyState icon="fact_check" title="Nog niet uitgevoerd" text="Controleert datastructuur, weeknummers, overlappende afspraken per persoon en agendakleuren." action={<Button variant="primary" icon="play_arrow" onClick={execute} loading={running}>Uitvoeren</Button>} />
            ) : (
                <div className="table-wrap">
                    {run.checks.map((c) => (
                        <div key={c.name} className="vrow">
                            <Pill family={c.state === 'PASS' ? 'done' : c.state === 'WARN' ? 'progress' : 'blocked'} icon={c.state === 'PASS' ? 'check_circle' : c.state === 'WARN' ? 'warning' : 'error'}>{c.state}</Pill>
                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                            <span className="col gap-1">
                                <span className="secondary">{c.detail}</span>
                                {c.links && c.links.length > 0 && (
                                    <span className="col">
                                        {c.links.map((l, i) => <Link key={`${l.to}-${i}`} to={l.to} className="t-caption row"><Icon name="door_front" size="dense" />{l.label}</Link>)}
                                    </span>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ValidatorPage;
