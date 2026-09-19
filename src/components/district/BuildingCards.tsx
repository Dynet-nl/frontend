// Card mode of the building list: same data and filters as the table, one card per building
// with the floor-stack thumbnail coloured by delivery status.

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { Pill } from '../ui/Pill';
import { ProgressBar, FloorStack } from '../ui/Panel';
import AppointmentLine from '../AppointmentLine';
import BuildingActions from './BuildingActions';
import { t } from '../../i18n';
import { fmtPercent } from '../../utils/format';
import { hasTypeStatus, deliveryStatus } from '../../utils/status';
import { isFlatCompleted } from '../../utils/completionUtils';
import { apartmentHref } from '../../utils/routes';
import { flatDisplayName } from '../../utils/buildingSummary';
import type { BuildingSummary } from '../../utils/buildingSummary';

interface BuildingCardsProps {
    rows: BuildingSummary[];
    roles: number[];
    onBlock: (s: BuildingSummary) => void;
    onUnblock: (s: BuildingSummary) => void;
}

const BuildingCards: React.FC<BuildingCardsProps> = ({ rows, roles, onBlock, onUnblock }) => (
    <>
        <div className="cards">
            {rows.map((s) => {
                const b = s.building;
                const pct = s.total > 0 ? (s.completed / s.total) * 100 : 0;
                return (
                    <article key={b._id} className={`card ${b.isBlocked ? 'card--blocked' : ''}`.trim()}>
                        {b.isBlocked && (
                            <div className="card__blocked">
                                <Icon name="block" />
                                <span>{t('common.blocked')}{b.blockReason ? ` · ${b.blockReason}` : ''}</span>
                            </div>
                        )}
                        <div className="card__head">
                            <FloorStack statuses={s.stack} large />
                            <div className="col grow" style={{ minWidth: 0 }}>
                                <Link to={`/building/${b._id}`} className="card__title" style={{ color: 'inherit' }}>{b.address}</Link>
                                <span className="card__sub">{[s.complexName, b.postcode].filter(Boolean).join(' · ')}</span>
                                <span className="card__sub">{[s.typeLabel, `${s.total} flats`, s.hbNumber].filter(Boolean).join(' · ')}</span>
                            </div>
                            <span className="card__pct">
                                {s.completed}/{s.total}
                                <br />
                                {fmtPercent(pct, 0)}
                            </span>
                        </div>
                        <div className="card__progress">
                            <ProgressBar value={pct} size="sm" className="grow" />
                            <span className="nowrap">{s.scheduled} {t('status.scheduled').toLowerCase()}</span>
                        </div>
                        <div className="card__flats">
                            {s.flatsTopFirst.map((f) => {
                                const hm = f.hasMonteur?.appointmentBooked;
                                const tp = f.technischePlanning?.appointmentBooked;
                                const status = isFlatCompleted(f) ? deliveryStatus('2') : deliveryStatus(f.fcStatusHas);
                                return (
                                    <Link key={f._id} to={apartmentHref(f._id)} className="card__flat">
                                        <span className="row" style={{ minWidth: 0 }}>
                                            <span className={`dot dot--${status.family}`} title={status.label} />
                                            <span className="card__flat-name truncate">{flatDisplayName(f)}</span>
                                        </span>
                                        <span className="row">
                                            {hm?.date ? (
                                                <>
                                                    <AppointmentLine kind="has" appointment={hm} showType={false} />
                                                    <Pill family={hasTypeStatus(hm.type).family}>{hasTypeStatus(hm.type).label}</Pill>
                                                </>
                                            ) : tp?.date ? (
                                                <>
                                                    <AppointmentLine kind="technical" appointment={tp} showType={false} />
                                                    <Pill family="planned">Schouw</Pill>
                                                </>
                                            ) : (
                                                <AppointmentLine kind="technical" appointment={null} />
                                            )}
                                        </span>
                                        <Icon name="chevron_right" />
                                    </Link>
                                );
                            })}
                        </div>
                        <div className="card__foot">
                            <BuildingActions summary={s} roles={roles} onBlock={onBlock} onUnblock={onUnblock} dense={false} />
                        </div>
                    </article>
                );
            })}
        </div>
        <div className="legend">
            <span><span className="legend__sw" style={{ background: 'var(--floor-done)' }} />{t('status.completed')}</span>
            <span><span className="legend__sw" style={{ background: 'var(--floor-progress)' }} />{t('status.inProgress')}</span>
            <span><span className="legend__sw" style={{ background: 'var(--floor-none)' }} />{t('status.notStarted')}</span>
            <span className="muted">Thumbnail = één blok per flat, onderste blok is de begane grond.</span>
        </div>
    </>
);

export default BuildingCards;
