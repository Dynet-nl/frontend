// Flat detail. One page for every role; sections and actions are gated by role, and a
// row the API withholds (e.g. the phone number for a Werkvoorbereider) is simply absent.

import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useIsPhone } from '../hooks/useMediaQuery';
import { usePageChrome } from '../components/shell/ShellContext';
import TechnicalPlanningDialog from '../components/apartment/TechnicalPlanningDialog';
import CompletionForm from '../components/apartment/CompletionForm';
import AppointmentLine from '../components/AppointmentLine';
import { ROLES } from '../utils/constants';
import { t } from '../i18n';
import { fmtDate, fmtDayMonth, fmtRange, fmtDateTime, fmtPhone, telHref, mapsHref, isSameDay, floorLabel } from '../utils/format';
import { deliveryStatus, hasTypeStatus, installationStatus } from '../utils/status';
import { canScheduleHas, canScheduleTechnical, scheduleFlatHref, uploadUrl } from '../utils/routes';
import { flatLabel } from '../types/domain';
import { Button, LinkButton, Menu, Panel, KV, Pill, KeyChip, StatusPill, Icon, Modal, ErrorState, SkeletonRows, EmptyState } from '../components/ui';

interface Apartment {
    _id: string;
    building?: string;
    district?: string;
    complexNaam?: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    zoeksleutel?: string;
    postcode?: string;
    email?: string;
    team?: string;
    soortBouw?: string;
    ipVezelwaarde?: string;
    odf?: string;
    odfPositie?: string;
    fcStatusHas?: string;
    toelichtingStatus?: string;
    laswerkAP?: string;
    laswerkDP?: string;
    ap?: string;
    dp?: string;
    tkNummer?: string;
    createdAt?: string;
    updatedAt?: string;
    technischePlanning?: {
        _id?: string;
        telephone?: string;
        vveWocoName?: string;
        technischeSchouwerName?: string;
        readyForSchouwer?: boolean;
        signed?: boolean;
        calledAlready?: boolean;
        timesCalled?: number;
        smsSent?: boolean;
        additionalNotes?: string;
        appointmentBooked?: { date?: string; startTime?: string; endTime?: string; weekNumber?: number };
        updatedAt?: string;
        lastModifiedBy?: string | { name?: string };
    };
    hasMonteur?: {
        _id?: string;
        hasMonteurName?: string;
        appointmentBooked?: { type?: string; date?: string; startTime?: string; endTime?: string; weekNumber?: number; complaintDetails?: string };
        installation?: { status?: string; startTime?: string; endTime?: string };
        technicalDetails?: { cableInstalled?: boolean; signalStrength?: number; connectionTest?: { performed?: boolean; result?: string } };
        documentation?: { photos?: string[]; notes?: string; customerSignature?: string };
        updatedAt?: string;
    };
}

const name = (a: Apartment) => flatLabel(a) || a._id;

/** "AP2 · DP5 · TK123": values already carrying their prefix are not prefixed twice. */
const ref = (label: string, value?: string) => {
    if (!value) return null;
    return value.toUpperCase().startsWith(label.toUpperCase()) ? value : `${label} ${value}`;
};

const yesNo = (v?: boolean) => (v ? t('common.yes') : t('common.no'));

const ApartmentPage: React.FC = () => {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { auth } = useAuth();
    const roles = useMemo(() => auth.roles ?? [], [auth.roles]);
    const isPhone = useIsPhone();
    const has = (...r: number[]) => r.some((x) => roles.includes(x));
    const isAdmin = has(ROLES.ADMIN);
    const technicalPlanner = has(ROLES.ADMIN, ROLES.TECHNICAL_PLANNING, ROLES.WERKVOORBEREIDER, ROLES.TECHNICAL_INSPECTOR);
    const hasRole = has(ROLES.ADMIN, ROLES.HAS_PLANNING, ROLES.HAS_MONTEUR);
    const fieldOnly = has(ROLES.TECHNICAL_INSPECTOR, ROLES.HAS_MONTEUR) && !has(ROLES.ADMIN, ROLES.TECHNICAL_PLANNING, ROLES.HAS_PLANNING, ROLES.WERKVOORBEREIDER);
    const isMonteur = has(ROLES.HAS_MONTEUR);

    const { data: flat, loading, error, status, reload, setData } = useApi<Apartment>(id ? `/api/apartment/${id}` : null);
    const title = flat ? name(flat) : '…';
    usePageChrome(
        [
            { label: t('nav.districts'), path: '/districts' },
            ...(flat?.complexNaam ? [{ label: flat.complexNaam }] : []),
            { label: title },
        ],
        flat ? title : undefined
    );

    const [editPlanning, setEditPlanning] = useState(false);
    const [completeOpen, setCompleteOpen] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);

    if (loading && !flat) return <SkeletonRows rows={6} />;
    if (status === 404) return <EmptyState icon="door_front" title={t('flat.notFound')} center />;
    if (error && !flat) return <ErrorState onRetry={reload} />;
    if (!flat) return null;

    const tp = flat.technischePlanning;
    const hm = flat.hasMonteur;
    const tpAppt = tp?.appointmentBooked;
    const hmAppt = hm?.appointmentBooked;
    const delivered = String(flat.fcStatusHas) === '2' || hm?.installation?.status === 'completed';
    const status2 = deliveryStatus(delivered ? '2' : flat.fcStatusHas);
    const hasTodayAppt = hmAppt?.date && isSameDay(hmAppt.date, new Date());
    const photos = (hm?.documentation?.photos ?? []).map((p) => uploadUrl(p)).filter((p): p is string => !!p);
    const signature = hm?.documentation?.customerSignature;

    const steps = [
        {
            icon: tpAppt?.date ? 'check_circle' : 'radio_button_unchecked',
            family: tpAppt?.date ? 'done' : 'none',
            title: t('flat.status.technical'),
            sub: tpAppt?.date ? `${fmtDayMonth(tpAppt.date)} · ${fmtRange(tpAppt.startTime, tpAppt.endTime)}${tp?.technischeSchouwerName ? ` · ${tp.technischeSchouwerName}` : ''}` : t('flat.status.notYet'),
        },
        {
            icon: tp?.signed ? 'check_circle' : 'radio_button_unchecked',
            family: tp?.signed ? 'done' : 'none',
            title: t('flat.status.signed'),
            sub: tp?.signed ? [tp.technischeSchouwerName, tp.updatedAt ? fmtDayMonth(tp.updatedAt) : ''].filter(Boolean).join(' · ') || t('common.yes') : t('flat.status.notYet'),
        },
        {
            icon: hmAppt?.date ? (delivered ? 'check_circle' : 'event_available') : 'radio_button_unchecked',
            family: hmAppt?.date ? (delivered ? 'done' : 'planned') : 'none',
            title: t('flat.status.has'),
            sub: hmAppt?.date ? `${fmtDayMonth(hmAppt.date)} · ${fmtRange(hmAppt.startTime, hmAppt.endTime)}${hm?.hasMonteurName ? ` · ${hm.hasMonteurName}` : ''}` : t('flat.status.notYet'),
        },
        {
            icon: delivered ? 'check_circle' : hm?.installation?.status === 'issues' ? 'error' : 'radio_button_unchecked',
            family: delivered ? 'done' : hm?.installation?.status === 'issues' ? 'progress' : 'none',
            title: t('flat.status.delivered'),
            sub: delivered ? (hm?.installation?.endTime ? fmtDate(hm.installation.endTime) : t('flat.status.done')) : hm?.installation?.status === 'issues' ? t('status.issues') : t('flat.status.notYet'),
        },
    ];

    const onSaved = (updated: unknown) => {
        const u = updated as Partial<Apartment>;
        setData((prev) => (prev ? { ...prev, ...u } : prev));
        reload();
    };

    const tel = telHref(tp?.telephone);
    const subline = [flat.complexNaam, flat.postcode, flat.team, flat.toevoeging ? `toevoeging ${flat.toevoeging} (${floorLabel(flat.toevoeging).toLowerCase()})` : ''].filter(Boolean).join(' · ');

    return (
        <div className="page">
            <header className="flat-head">
                <div className="col gap-2 grow">
                    <div className="flat-head__title">
                        <h1 className="t-title-l">{title}</h1>
                        {flat.zoeksleutel && <KeyChip title="zoeksleutel">{flat.zoeksleutel}</KeyChip>}
                        <StatusPill status={status2} size="md" />
                        {hasTodayAppt && hmAppt && (
                            <Pill family={hasTypeStatus(hmAppt.type).family} icon="today" size="md">
                                {t('common.today')} {fmtRange(hmAppt.startTime, hmAppt.endTime)} · {hasTypeStatus(hmAppt.type).label}
                            </Pill>
                        )}
                    </div>
                    {subline && <div className="flat-head__sub">{subline}</div>}
                </div>
                <div className="flat-head__actions">
                    {fieldOnly ? (
                        <>
                            {tel && <a className="btn btn--secondary" href={tel}><Icon name="call" /><span>{t('home.call')}</span></a>}
                            <a className="btn btn--secondary" href={mapsHref(name(flat), flat.postcode)} target="_blank" rel="noreferrer"><Icon name="near_me" /><span>{t('home.route')}</span></a>
                            {isMonteur && hm && !delivered && !isPhone && (
                                <Button variant="accent" icon="task_alt" onClick={() => setCompleteOpen(true)}>{t('flat.complete')}</Button>
                            )}
                        </>
                    ) : (
                        <>
                            {canScheduleTechnical(roles) && (
                                <LinkButton to={scheduleFlatHref(flat._id, 'Technical')} variant="secondary" icon="search_check">{t('flat.scheduleSurvey')}</LinkButton>
                            )}
                            {canScheduleHas(roles) && (
                                <LinkButton to={scheduleFlatHref(flat._id, 'HAS')} variant="accent" icon="event">{t('flat.scheduleHas')}</LinkButton>
                            )}
                            <Menu
                                items={[
                                    ...(flat.building ? [{ label: t('building.title'), icon: 'architecture', onSelect: () => navigate(`/building/${flat.building}`) }] : []),
                                    { label: 'Route', icon: 'near_me', onSelect: () => window.open(mapsHref(name(flat), flat.postcode), '_blank', 'noopener') },
                                    ...(tel ? [{ label: `${t('home.call')} ${fmtPhone(tp?.telephone)}`, icon: 'call', onSelect: () => { window.location.href = tel; } }] : []),
                                ]}
                            />
                        </>
                    )}
                </div>
            </header>

            <div className="steps">
                {steps.map((s) => (
                    <div key={s.title} className={`step step--${s.family}`}>
                        <Icon name={s.icon} />
                        <span className="col" style={{ minWidth: 0 }}>
                            <span className="step__title">{s.title}</span>
                            <span className="step__sub truncate">{s.sub}</span>
                        </span>
                    </div>
                ))}
            </div>

            {isMonteur && hm && !delivered && (isPhone || fieldOnly) && (
                <Panel title={t('flat.completeTitle')} icon="task_alt">
                    <CompletionForm flatId={flat._id} onSaved={onSaved} existingPhotos={photos} />
                </Panel>
            )}

            <div className="flat-grid">
                <Panel title={t('flat.location')} icon="place">
                    <KV
                        rows={[
                            { label: t('flat.address'), value: name(flat) },
                            { label: t('flat.postcode'), value: flat.postcode, mono: true },
                            { label: t('flat.phone'), value: tp?.telephone ? <a href={tel}>{fmtPhone(tp.telephone)}</a> : undefined, mono: true },
                            { label: t('flat.email'), value: flat.email ? <a href={`mailto:${flat.email}`}>{flat.email}</a> : undefined },
                            { label: t('flat.vve'), value: tp?.vveWocoName },
                        ]}
                    />
                </Panel>

                <Panel title={t('flat.technical')} icon="cable">
                    <KV
                        rows={[
                            { label: t('flat.team'), value: flat.team },
                            { label: t('flat.odf'), value: flat.odf, mono: true },
                            { label: t('flat.odfPos'), value: flat.odfPositie, mono: true },
                            { label: t('flat.ipFibre'), value: flat.ipVezelwaarde, mono: true },
                            { label: t('flat.buildType'), value: flat.soortBouw },
                        ]}
                    />
                    {(flat.ap || flat.dp || flat.tkNummer || flat.laswerkAP || flat.laswerkDP) && (
                        <div className="note mono">
                            {[ref('AP', flat.ap), ref('DP', flat.dp), ref('TK', flat.tkNummer), flat.laswerkAP && `laswerk AP ${flat.laswerkAP}`, flat.laswerkDP && `laswerk DP ${flat.laswerkDP}`].filter(Boolean).join(' · ')}
                        </div>
                    )}
                </Panel>

                {(technicalPlanner || isAdmin) && (
                    <Panel
                        title={t('flat.planning')}
                        icon="search_check"
                        actions={technicalPlanner && !fieldOnly ? <Button variant="link" size="dense" onClick={() => setEditPlanning(true)}>{t('common.edit')}</Button> : undefined}
                    >
                        {tp ? (
                            <>
                                <KV
                                    rows={[
                                        { label: t('flat.surveyor'), value: tp.technischeSchouwerName },
                                        { label: t('flat.readyForSurvey'), value: <span style={{ color: tp.readyForSchouwer ? 'var(--status-done-fg)' : undefined }}>{yesNo(tp.readyForSchouwer)}</span> },
                                        { label: t('flat.called'), value: tp.timesCalled ? `${tp.timesCalled}× · ${fmtDayMonth(tp.updatedAt)}` : t('common.no') },
                                        { label: t('flat.smsSent'), value: yesNo(tp.smsSent) },
                                        { label: t('flat.appointment'), value: tpAppt?.date ? <AppointmentLine kind="technical" appointment={tpAppt} showType={false} /> : t('common.noAppointment') },
                                    ]}
                                />
                                {tp.additionalNotes && <div className="note">{t('flat.notes')}: {tp.additionalNotes}</div>}
                            </>
                        ) : (
                            <p className="t-small muted">{t('common.noAppointment')}. {technicalPlanner && !fieldOnly ? 'Bel de bewoner en leg het gesprek hier vast.' : ''}</p>
                        )}
                    </Panel>
                )}

                {hasRole && (
                    <Panel
                        title={t('flat.hasPlanning')}
                        icon="engineering"
                        actions={canScheduleHas(roles) && !fieldOnly ? <LinkButton to={scheduleFlatHref(flat._id, 'HAS')} variant="link" size="dense">{t('common.edit')}</LinkButton> : undefined}
                    >
                        {hm ? (
                            <>
                                <KV
                                    rows={[
                                        { label: t('flat.installer'), value: hm.hasMonteurName },
                                        { label: t('flat.type'), value: hmAppt?.type ? <StatusPill status={hasTypeStatus(hmAppt.type)} /> : undefined },
                                        { label: t('flat.appointment'), value: hmAppt?.date ? <AppointmentLine kind="has" appointment={hmAppt} showType={false} /> : t('common.noAppointment') },
                                        { label: t('flat.installStatus'), value: <StatusPill status={installationStatus(hm.installation?.status)} /> },
                                        { label: t('flat.cableInstalled'), value: hm.technicalDetails?.cableInstalled === undefined ? undefined : yesNo(hm.technicalDetails.cableInstalled) },
                                        { label: t('flat.signalStrength'), value: hm.technicalDetails?.signalStrength !== undefined && hm.technicalDetails?.signalStrength !== null ? `${String(hm.technicalDetails.signalStrength).replace('.', ',')} dBm` : undefined, mono: true },
                                        { label: t('flat.connectionTest'), value: hm.technicalDetails?.connectionTest?.performed ? hm.technicalDetails.connectionTest.result || t('common.yes') : undefined },
                                    ]}
                                />
                                {hmAppt?.complaintDetails && <div className="note">{t('scheduler.complaintDetails')}: {hmAppt.complaintDetails}</div>}
                                {hm.documentation?.notes && <div className="note">{t('flat.notes')}: {hm.documentation.notes}</div>}
                            </>
                        ) : (
                            <p className="t-small muted">{t('common.noAppointment')}.</p>
                        )}
                    </Panel>
                )}

                {hasRole && hm && (
                    <Panel title={t('flat.delivery')} icon="photo_library">
                        <div className="col gap-3">
                            {photos.length > 0 ? (
                                <div className="photos">
                                    {photos.map((p) => (
                                        <a key={p} className="photo" href={p} target="_blank" rel="noreferrer"><img src={p} alt="" /></a>
                                    ))}
                                </div>
                            ) : (
                                <p className="t-small muted">Nog geen foto’s.</p>
                            )}
                            {signature && (
                                <span className="row t-small">
                                    <Icon name="draw" className="muted" />
                                    {t('flat.signature')}
                                </span>
                            )}
                            {!delivered && !fieldOnly && (
                                <Button variant="accent" icon="task_alt" onClick={() => setCompleteOpen(true)}>{t('flat.complete')}</Button>
                            )}
                        </div>
                    </Panel>
                )}
            </div>

            {isAdmin && (
                <div className="col gap-2">
                    <button type="button" className="disclosure" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((o) => !o)}>
                        <Icon name="expand_more" className="chev" />
                        <span className="col" style={{ minWidth: 0 }}>
                            <span className="disclosure__title">{t('flat.advanced')}</span>
                            <span className="disclosure__sub">{t('flat.advancedSub')}</span>
                        </span>
                    </button>
                    {advancedOpen && (
                        <Panel>
                            <KV
                                rows={[
                                    { label: 'AP', value: flat.ap, mono: true },
                                    { label: 'DP', value: flat.dp, mono: true },
                                    { label: 'Laswerk AP', value: flat.laswerkAP },
                                    { label: 'Laswerk DP', value: flat.laswerkDP },
                                    { label: 'TK-nummer', value: flat.tkNummer, mono: true },
                                    { label: 'Toelichting status', value: flat.toelichtingStatus },
                                    { label: 'Opleverstatus (code)', value: flat.fcStatusHas, mono: true },
                                    { label: 'Flat-id', value: flat._id, mono: true },
                                    { label: t('flat.created'), value: fmtDateTime(flat.createdAt), mono: true },
                                    { label: t('flat.updated'), value: fmtDateTime(flat.updatedAt), mono: true },
                                    { label: 'Technische planning bijgewerkt', value: fmtDateTime(tp?.updatedAt), mono: true },
                                    { label: 'HAS bijgewerkt', value: fmtDateTime(hm?.updatedAt), mono: true },
                                ]}
                            />
                        </Panel>
                    )}
                </div>
            )}

            <TechnicalPlanningDialog open={editPlanning} flatId={flat._id} initial={tp} onClose={() => setEditPlanning(false)} onSaved={onSaved} showTelephone={!has(ROLES.WERKVOORBEREIDER) || isAdmin || has(ROLES.TECHNICAL_PLANNING)} />

            <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title={t('flat.complete')} subtitle={title} size="medium">
                <CompletionForm flatId={flat._id} existingPhotos={photos} onSaved={(u) => { onSaved(u); setCompleteOpen(false); }} onCancel={() => setCompleteOpen(false)} />
            </Modal>
        </div>
    );
};

export default ApartmentPage;
