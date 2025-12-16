// Individual building card component displaying building info and flats

import React from 'react';
import { Link } from 'react-router-dom';
import RoleBasedLink from '../RoleBasedLink';
import BuildingVisual from './BuildingVisual';
import pencilIcon from '../../assets/pencil_edit.png';
import { categorizeBuilding, generateHBNumber } from '../../utils/buildingCategorization';
import { hasAnyAppointment, isFlatCompleted } from '../../utils/completionUtils';

const BuildingCard = ({ 
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
                    <Link to={`/building/${building._id}`} style={{opacity: building.isBlocked ? 0.6 : 1}}>
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
                    <RoleBasedLink
                        buildingId={building._id}
                        building={building}
                        type="schedule"
                        className="editIconLink"
                        style={{opacity: building.isBlocked ? 0.4 : 1, pointerEvents: building.isBlocked ? 'none' : 'auto'}}
                    >
                        <img src={pencilIcon} alt="Edit" className="editIcon"/>
                    </RoleBasedLink>
                </div>
                
                <div className="buildingType" data-type={typeString}>
                    <b>{typeString}</b>
                </div>
                
                <div className="flatsWrapper">
                    <FlatLinks flats={sortedFlats} types={types} building={building} />
                </div>
            </div>
        </div>
    );
};

// Helper function to sort flats by floor (highest first) then by unit
const sortFlats = (a, b) => {
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

// Sub-component for rendering flat links
const FlatLinks = ({ flats, types, building }) => {
    if (!flats || flats.length === 0) return null;
    
    // For single-flat buildings (Laag bouw), show the address with toevoeging if present
    if (flats.length === 1 && types.some(type => type.type === 'Laag bouw')) {
        const singleFlat = flats[0];
        const hasAppt = hasAnyAppointment(singleFlat);
        const flatClassName = hasAppt ? 'flatLink flatWithAppointment' : 'flatLink';
        // Show building address plus toevoeging if it exists
        const displayAddress = singleFlat.toevoeging 
            ? `${building.address} ${singleFlat.toevoeging}`
            : building.address;
        return (
            <RoleBasedLink key={singleFlat._id} flatId={singleFlat._id} className={flatClassName}>
                <div className="flatInfo" style={{backgroundColor: hasAppt ? '#90EE90' : 'inherit'}}>
                    {displayAddress}
                </div>
            </RoleBasedLink>
        );
    }
    
    return flats.map(flat => {
        if (!flat) return null;
        const hasAppt = hasAnyAppointment(flat);
        const flatClassName = hasAppt ? 'flatLink flatWithAppointment' : 'flatLink';
        // Build display string with fallbacks
        const flatDisplay = flat.complexNaam 
            ? `${flat.complexNaam}${flat.toevoeging ? ` - ${flat.toevoeging}` : ''}`
            : `${flat.adres || ''} ${flat.huisNummer || ''}${flat.toevoeging || ''}`.trim();
        return (
            <RoleBasedLink key={flat._id} flatId={flat._id} className={flatClassName}>
                <div className="flatInfo" style={{backgroundColor: hasAppt ? '#90EE90' : 'inherit'}}>
                    {flatDisplay || 'Unknown flat'}
                </div>
            </RoleBasedLink>
        );
    });
};

export default React.memo(BuildingCard);
