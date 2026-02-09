// Individual building card component displaying building info, appointment summary, and flat rows

import React from 'react';
import { Link } from 'react-router-dom';
import RoleBasedLink from '../RoleBasedLink';
import BuildingVisual from './BuildingVisual';
import { categorizeBuilding, generateHBNumber } from '../../utils/buildingCategorization';
import { hasAnyAppointment, isFlatCompleted, formatAppointmentInline } from '../../utils/completionUtils';

interface Flat {
    _id: string;
    toevoeging?: string;
    zoeksleutel?: string;
    postcode?: string;
    fcStatusHas?: string | number;
    complexNaam?: string;
    adres?: string;
    huisNummer?: string;
    technischePlanning?: {
        appointmentBooked?: { date?: string; startTime?: string; endTime?: string };
        technischeSchouwerName?: string;
    };
    hasMonteur?: {
        appointmentBooked?: { date?: string; startTime?: string; endTime?: string; type?: string };
        hasMonteurName?: string;
    };
}

interface BuildingType {
    type: string;
    prefix: string;
}

interface Building {
    _id: string;
    address: string;
    flats?: Flat[];
    isBlocked?: boolean;
    blockReason?: string;
}

interface BuildingCardProps {
    building: Building;
    isWerkvoorbereider: boolean;
    onToggleBlock: (building: Building) => void;
}

// Helper function to sort flats by floor (highest first) then by unit
const sortFlats = (a: Flat, b: Flat): number => {
    const toevA = a?.toevoeging?.toString()?.trim()?.toUpperCase() || '';
    const toevB = b?.toevoeging?.toString()?.trim()?.toUpperCase() || '';

    // If both are empty, maintain original order
    if (!toevA && !toevB) return 0;
    // Empty values go to the end
    if (!toevA) return 1;
    if (!toevB) return -1;

    // Ground floor indicators go last (bottom of building)
    const groundIndicators = ['H', 'BG', 'GF', 'G', '0', '00'];
    const isAGround = groundIndicators.includes(toevA);
    const isBGround = groundIndicators.includes(toevB);
    if (isAGround && !isBGround) return 1;
    if (!isAGround && isBGround) return -1;
    if (isAGround && isBGround) return 0;

    // Check if both are numeric
    const numA = parseInt(toevA, 10);
    const numB = parseInt(toevB, 10);
    const isANumeric = !isNaN(numA);
    const isBNumeric = !isNaN(numB);

    if (isANumeric && isBNumeric) {
        // Sort numeric descending (higher floors first)
        return numB - numA;
    }

    // Mixed: numeric values come before letters
    if (isANumeric && !isBNumeric) return -1;
    if (!isANumeric && isBNumeric) return 1;

    // Both are non-numeric strings, sort alphabetically descending
    return toevB.localeCompare(toevA);
};

// Get display name for a flat
const getFlatDisplayName = (flat: Flat, building: Building, isSingleLaagbouw: boolean): string => {
    if (isSingleLaagbouw) {
        return flat.toevoeging
            ? `${building.address} ${flat.toevoeging}`
            : building.address;
    }
    if (flat.complexNaam) {
        return `${flat.complexNaam}${flat.toevoeging ? ` - ${flat.toevoeging}` : ''}`;
    }
    return `${flat.adres || ''} ${flat.huisNummer || ''}${flat.toevoeging || ''}`.trim() || 'Unknown flat';
};

// Sub-component: Appointment summary bar
interface AppointmentSummaryProps {
    scheduledCount: number;
    totalCount: number;
    building: Building;
}

const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({ scheduledCount, totalCount, building }) => {
    const percentage = totalCount > 0 ? Math.round((scheduledCount / totalCount) * 100) : 0;

    return (
        <div className="appointmentSummary">
            <div className="appointmentSummaryInfo">
                <span className="appointmentSummaryText">
                    <strong>{scheduledCount}</strong>/{totalCount} scheduled
                </span>
                <div className="appointmentProgressBarTrack">
                    <div
                        className="appointmentProgressBarFill"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
            <RoleBasedLink
                buildingId={building._id}
                building={building}
                type="schedule"
                className="scheduleButton"
                style={{ opacity: building.isBlocked ? 0.4 : 1, pointerEvents: building.isBlocked ? 'none' : 'auto' }}
            >
                + Schedule
            </RoleBasedLink>
        </div>
    );
};

// Sub-component: Individual flat row with appointment details
interface FlatRowProps {
    flat: Flat;
    building: Building;
    isSingleLaagbouw: boolean;
}

const FlatRow: React.FC<FlatRowProps> = ({ flat, building, isSingleLaagbouw }) => {
    const hasAppt = hasAnyAppointment(flat);
    const displayName = getFlatDisplayName(flat, building, isSingleLaagbouw);

    const techAppt = formatAppointmentInline(flat.technischePlanning?.appointmentBooked);
    const techName = flat.technischePlanning?.technischeSchouwerName;
    const hasAppt_tech = !!(flat.technischePlanning?.appointmentBooked?.date);

    const hasMonteurAppt = formatAppointmentInline(flat.hasMonteur?.appointmentBooked);
    const hasMonteurName = flat.hasMonteur?.hasMonteurName;
    const hasMonteurType = flat.hasMonteur?.appointmentBooked?.type;
    const hasAppt_has = !!(flat.hasMonteur?.appointmentBooked?.date);

    return (
        <RoleBasedLink flatId={flat._id} className="flatRowLink">
            <div className="flatRow">
                <div className="flatRowMain">
                    <span className="flatAddress">{displayName}</span>
                    <div className="flatRowRight">
                        <span className={`flatStatusDot ${hasAppt ? 'scheduled' : 'none'}`} />
                        <span className="flatRowChevron">&rsaquo;</span>
                    </div>
                </div>
                <div className="flatRowDetails">
                    {hasAppt_tech && (
                        <div className="flatAppointmentDetail">
                            {techAppt || 'Scheduled'}
                            {techName && <span className="flatTechName"> &middot; Tech: {techName}</span>}
                        </div>
                    )}
                    {hasAppt_has && (
                        <div className="flatAppointmentDetail">
                            {hasMonteurAppt || 'Scheduled'}
                            {hasMonteurName && <span className="flatTechName"> &middot; HAS: {hasMonteurName}</span>}
                            {hasMonteurType && (
                                <span className="flatAppointmentTypeBadge">{hasMonteurType}</span>
                            )}
                        </div>
                    )}
                    {!hasAppt_tech && !hasAppt_has && (
                        <div className="flatAppointmentDetail noAppointment">No appointment</div>
                    )}
                </div>
            </div>
        </RoleBasedLink>
    );
};

// Sub-component for rendering flat rows
interface FlatRowsProps {
    flats: Flat[];
    types: BuildingType[];
    building: Building;
}

const FlatRows: React.FC<FlatRowsProps> = ({ flats, types, building }) => {
    if (!flats || flats.length === 0) return null;
    const isSingleLaagbouw = flats.length === 1 && types.some(type => type.type === 'Laag bouw');

    return (
        <>
            {flats.map(flat => {
                if (!flat) return null;
                return (
                    <FlatRow
                        key={flat._id}
                        flat={flat}
                        building={building}
                        isSingleLaagbouw={isSingleLaagbouw}
                    />
                );
            })}
        </>
    );
};

const BuildingCard: React.FC<BuildingCardProps> = ({
    building,
    isWerkvoorbereider,
    onToggleBlock
}) => {
    const flats = building.flats || [];
    const { types, typeString } = categorizeBuilding(flats);
    const sortedFlats = [...flats].sort(sortFlats);
    const flatCount = sortedFlats.length;
    const hbNumber = generateHBNumber(building, sortedFlats);

    // Use consistent completion logic from completionUtils
    const completedFlats = sortedFlats.filter(flat => isFlatCompleted(flat)).length;
    const completionPercentage = flatCount > 0 ? Math.round((completedFlats / flatCount) * 100) : 0;

    // Count flats with any appointment scheduled
    const scheduledCount = sortedFlats.filter(flat => hasAnyAppointment(flat)).length;

    return (
        <div className="buildingContainer">
            <BuildingVisual
                flats={sortedFlats}
                typeString={typeString}
                completionPercentage={completionPercentage}
            />

            <div className={`buildingInfo ${building.isBlocked ? 'blocked-building' : ''}`}>
                {building.isBlocked && (
                    <div className="block-indicator">
                        <span className="block-icon">🚫</span>
                        <span className="block-text">BLOCKED</span>
                        <div className="block-reason">{building.blockReason}</div>
                    </div>
                )}

                <div className="buildingHeaderSection">
                    <Link to={`/building/${building._id}`} style={{ opacity: building.isBlocked ? 0.6 : 1 }}>
                        <div className="buildingHeader">
                            {building.flats?.[0]?.complexNaam || building.address}
                            {hbNumber && (
                                <div className="hbNumber" style={{
                                    fontSize: '0.9em',
                                    color: '#666',
                                    fontWeight: 'normal',
                                    marginTop: '2px'
                                }}>
                                    {hbNumber}
                                </div>
                            )}
                        </div>
                    </Link>
                    <div className="flatCountBox">{flatCount}</div>
                    {isWerkvoorbereider && (
                        <button
                            onClick={() => onToggleBlock(building)}
                            className={`block-toggle-btn ${building.isBlocked ? 'blocked' : 'active'}`}
                            title={building.isBlocked ? 'Unblock building' : 'Block building'}
                        >
                            {building.isBlocked ? '🔓' : '🔒'}
                        </button>
                    )}
                </div>

                <div className="buildingType" data-type={typeString}>
                    <b>{typeString}</b>
                </div>

                <AppointmentSummary
                    scheduledCount={scheduledCount}
                    totalCount={flatCount}
                    building={building}
                />

                <div className="flatsWrapper">
                    <FlatRows flats={sortedFlats} types={types} building={building} />
                </div>
            </div>
        </div>
    );
};

export default React.memo(BuildingCard);
