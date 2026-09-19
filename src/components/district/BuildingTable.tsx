// Dense building table: one row per building, expands in place to show its flats.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { Pill, KeyChip, StatusText } from '../ui/Pill';
import { ProgressBar, FloorStack } from '../ui/Panel';
import AppointmentLine from '../AppointmentLine';
import BuildingActions from './BuildingActions';
import { t } from '../../i18n';
import { deliveryStatus, hasTypeStatus, blockedStatus } from '../../utils/status';
import { isFlatCompleted } from '../../utils/completionUtils';
import { apartmentHref } from '../../utils/routes';
import { flatDisplayName, flatFloorLabel } from '../../utils/buildingSummary';
import type { BuildingSummary } from '../../utils/buildingSummary';
import type { Flat } from '../../types/domain';

interface BuildingTableProps {
    rows: BuildingSummary[];
    roles: number[];
    onBlock: (s: BuildingSummary) => void;
    onUnblock: (s: BuildingSummary) => void;
}

const flatStatus = (flat: Flat) => (isFlatCompleted(flat) ? deliveryStatus('2') : deliveryStatus(flat.fcStatusHas));

const FlatSubRow: React.FC<{ flat: Flat }> = ({ flat }) => {
    const tp = flat.technischePlanning?.appointmentBooked;
    const hm = flat.hasMonteur?.appointmentBooked;
    return (
        <tr className="is-subrow">
            <td />
            <td>
                <span className="flat-row">
                    <Icon name="door_front" />
                    <span className="flat-row__name">{flatDisplayName(flat)}</span>
                    {flat.zoeksleutel && <KeyChip>{flat.zoeksleutel}</KeyChip>}
                </span>
            </td>
            <td><StatusText status={flatStatus(flat)} /></td>
            <td className="t-caption secondary">{flatFloorLabel(flat)}</td>
            <td colSpan={2}>
                <span className="row row--wrap">
                    {hm?.date ? (
                        <>
                            <AppointmentLine kind="has" appointment={hm} person={flat.hasMonteur?.hasMonteurName} showType={false} />
                            <Pill family={hasTypeStatus(hm.type).family} icon={hasTypeStatus(hm.type).icon}>{hasTypeStatus(hm.type).label}</Pill>
                        </>
                    ) : tp?.date ? (
                        <>
                            <AppointmentLine kind="technical" appointment={tp} person={flat.technischePlanning?.technischeSchouwerName} showType={false} />
                            <Pill family="planned" icon="search_check">{t('agenda.survey')}</Pill>
                        </>
                    ) : (
                        <AppointmentLine kind="technical" appointment={null} />
                    )}
                </span>
            </td>
            <td>
                <div className="actions">
                    <Link to={apartmentHref(flat._id)} className="btn btn--ghost btn--dense">
                        <span>{t('common.open')}</span>
                        <Icon name="chevron_right" />
                    </Link>
                </div>
            </td>
        </tr>
    );
};

const BuildingTable: React.FC<BuildingTableProps> = ({ rows, roles, onBlock, onUnblock }) => {
    const [open, setOpen] = useState<Set<string>>(new Set());
    const toggle = (id: string) => setOpen((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

    return (
        <table className="table">
            <thead>
                <tr>
                    <th style={{ width: 36 }} aria-label="Uitklappen" />
                    <th>{t('district.col.building')}</th>
                    <th>{t('district.col.type')}</th>
                    <th>{t('district.col.flats')}</th>
                    <th style={{ width: 150 }}>{t('district.col.scheduled')}</th>
                    <th>{t('district.col.next')}</th>
                    <th aria-label="Acties" />
                </tr>
            </thead>
            <tbody>
                {rows.map((s) => {
                    const b = s.building;
                    const expanded = open.has(b._id);
                    const sub = [s.complexName, b.postcode, s.hbNumber].filter(Boolean);
                    return (
                        <React.Fragment key={b._id}>
                            <tr className={`${b.isBlocked ? 'is-blocked' : ''} ${expanded ? 'is-selected' : ''}`.trim()}>
                                <td>
                                    <button type="button" className="expander" onClick={() => toggle(b._id)} aria-expanded={expanded} aria-label={expanded ? 'Inklappen' : 'Uitklappen'}>
                                        <Icon name={expanded ? 'expand_more' : 'chevron_right'} size="dense" />
                                    </button>
                                </td>
                                <td>
                                    <span className="building-name">
                                        <span className="building-name__title">
                                            <Link to={`/building/${b._id}`} style={{ color: 'inherit' }}>{b.address}</Link>
                                            {b.isBlocked && <Pill family="blocked" icon="block" title={b.blockReason}>{t('common.blocked')}</Pill>}
                                        </span>
                                        {sub.length > 0 && (
                                            <span className="building-name__sub">
                                                {sub.map((x, i) => (
                                                    <React.Fragment key={i}>
                                                        {i > 0 && <span className="muted">·</span>}
                                                        {x === s.hbNumber ? <span className="mono">{x}</span> : <span>{x}</span>}
                                                    </React.Fragment>
                                                ))}
                                            </span>
                                        )}
                                    </span>
                                </td>
                                <td className="t-small secondary nowrap">{s.typeLabel || '—'}</td>
                                <td>
                                    <span className="row">
                                        <FloorStack statuses={s.stack} />
                                        <span className="mono">{s.total}</span>
                                    </span>
                                </td>
                                <td>
                                    <span className="progress-inline">
                                        <ProgressBar value={s.scheduled} max={s.total || 1} size="sm" />
                                        <span className="mono">{s.scheduled}/{s.total}</span>
                                    </span>
                                </td>
                                <td>
                                    {b.isBlocked ? (
                                        <StatusText status={blockedStatus()} />
                                    ) : s.next ? (
                                        <span className="row row--wrap">
                                            <AppointmentLine kind={s.next.kind} appointment={s.next.appointment} person={s.next.person} showType={false} />
                                            <Pill family={s.next.kind === 'has' ? hasTypeStatus(s.next.appointment.type).family : 'planned'} icon={s.next.kind === 'has' ? hasTypeStatus(s.next.appointment.type).icon : 'search_check'}>
                                                {s.next.kind === 'has' ? hasTypeStatus(s.next.appointment.type).label : 'Schouw'}
                                            </Pill>
                                        </span>
                                    ) : (
                                        <AppointmentLine kind="technical" appointment={null} />
                                    )}
                                </td>
                                <td>
                                    <BuildingActions summary={s} roles={roles} onBlock={onBlock} onUnblock={onUnblock} />
                                </td>
                            </tr>
                            {expanded && s.flatsTopFirst.map((f) => <FlatSubRow key={f._id} flat={f} />)}
                        </React.Fragment>
                    );
                })}
            </tbody>
        </table>
    );
};

export default BuildingTable;
