// Component displaying paginated building lists with filtering, search functionality, and role-based navigation.

import React, {useState, useEffect, useCallback, useMemo, useContext} from 'react';
import {Link} from 'react-router-dom';
import RoleBasedLink from './RoleBasedLink';
import pencilIcon from '../assets/pencil_edit.png';
import { categorizeBuilding, generateHBNumber } from '../utils/buildingCategorization';
import { hasAnyAppointment, calculateCompletionStatus } from '../utils/completionUtils';
import { filterBuildings, calculateFilterCounts } from '../utils/buildingFilters';
import '../styles/buildingsList.css';
import AuthContext from '../context/AuthProvider';
import ROLES_LIST from '../context/roles_list';
import axios from 'axios';
const BuildingsList = ({buildings, isLoading}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const buildingsPerPage = 20;
    const {user} = useContext(AuthContext);
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery, buildings]);
    useEffect(() => {
        if (filter === 'appointment' || filter === 'done') {
            if (buildings && buildings.length > 0) {
                let hasMonteursFound = [];
                let technischePlanningsFound = [];
                buildings.slice(0, 10).forEach(building => {
                    if (building.flats && building.flats.length > 0) {
                        building.flats.forEach(flat => {
                            if (flat.hasMonteur?.appointmentBooked?.date) {
                                hasMonteursFound.push({
                                    flatId: flat._id,
                                    buildingId: building._id,
                                    appointment: flat.hasMonteur.appointmentBooked
                                });
                            }
                            if (flat.technischePlanning?.appointmentBooked?.date) {
                                technischePlanningsFound.push({
                                    flatId: flat._id,
                                    buildingId: building._id,
                                    appointment: flat.technischePlanning.appointmentBooked
                                });
                            }
                        });
                    }
                });
            }
        }
    }, [filter, buildings, user]);
    const handleSearch = useCallback((e) => {
        setSearchQuery(e.target.value.toLowerCase());
        setCurrentPage(1);
    }, []);
    const handleFilterChange = useCallback((newFilter) => {
        if (filter === newFilter) {
setFilter('all');
        } else {
            setFilter(newFilter);
        }
        setCurrentPage(1);
    }, [filter]);

    const clearAllFilters = useCallback(() => {
        setFilter('all');
        setSearchQuery('');
        setCurrentPage(1);
    }, []);

    const isWerkvoorbereider = useMemo(() => {
        return user && user.roles && user.roles.Werkvoorbereider === ROLES_LIST.Werkvoorbereider;
    }, [user]);

    const handleBlockBuilding = async (buildingId, reason) => {
        try {
            const response = await axios.put(`/api/building/block/${buildingId}`, {
                reason: reason.trim()
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error blocking building:', error);
            alert('Failed to block building. Please try again.');
        }
    };

    const handleUnblockBuilding = async (buildingId) => {
        try {
            const response = await axios.put(`/api/building/unblock/${buildingId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error unblocking building:', error);
            alert('Failed to unblock building. Please try again.');
        }
    };

    const toggleBlockBuilding = (building) => {
        if (building.isBlocked) {
            if (window.confirm(`Are you sure you want to unblock "${building.address}"?`)) {
                handleUnblockBuilding(building._id);
            }
        } else {
            const reason = prompt('Enter reason for blocking this building:');
            if (reason && reason.trim()) {
                handleBlockBuilding(building._id, reason);
            }
        }
    };





    const sortFlats = (a, b) => {
        if (!a.toevoeging || !b.toevoeging) return 0;
        const isANumeric = !isNaN(a.toevoeging);
        const isBNumeric = !isNaN(b.toevoeging);
        if (isANumeric && isBNumeric) {
            if (a.toevoeging === "H") return 1;
            if (b.toevoeging === "H") return -1;
            return parseInt(b.toevoeging, 10) - parseInt(a.toevoeging, 10);
        }
        if (!isANumeric && !isBNumeric) {
            return b.toevoeging.localeCompare(a.toevoeging);
        }
        if (isANumeric) return -1;
        return 1;
    };
    const renderFlatLinks = (flats, types, building) => {
        if (!flats || flats.length === 0) return null;
        
        // For single-flat buildings (Laag bouw), show just the building address
        if (flats.length === 1 && types.some(type => type.type === 'Laag bouw')) {
            const singleFlat = flats[0];
            const hasAppt = hasAnyAppointment(singleFlat);
            const flatClassName = hasAppt ? 'flatLink flatWithAppointment' : 'flatLink';
            return (
                <RoleBasedLink key={singleFlat._id} flatId={singleFlat._id} className={flatClassName}>
                    <div className="flatInfo" style={{backgroundColor: hasAppt ? '#90EE90' : 'inherit'}}>
                        {building.address}
                    </div>
                </RoleBasedLink>
            );
        }
        return flats.map(flat => {
            if (!flat) return null;
            const hasAppt = hasAnyAppointment(flat);
            const flatClassName = hasAppt ? 'flatLink flatWithAppointment' : 'flatLink';
            const flatDisplay = flat.complexNaam ?
                `${flat.complexNaam} - ${flat.toevoeging}` :
                `${flat.adres} ${flat.huisNummer}${flat.toevoeging}`;
            return (
                <RoleBasedLink key={flat._id} flatId={flat._id} className={flatClassName}>
                    <div className="flatInfo" style={{backgroundColor: hasAppt ? '#90EE90' : 'inherit'}}>
                        {flatDisplay}
                    </div>
                </RoleBasedLink>
            );
        });
    };

    const filterCounts = useMemo(() => {
        return calculateFilterCounts(buildings);
    }, [buildings]);

    const categorizedBuildings = useMemo(() => {
        return buildings ? filterBuildings(buildings, searchQuery, filter) : [];
    }, [buildings, searchQuery, filter]);
    const totalResults = categorizedBuildings.length;
    const completionStatus = useMemo(() => {
        return calculateCompletionStatus(categorizedBuildings);
    }, [categorizedBuildings]);
    const {
        percentage: completionPercentage,
        completedFlats,
        totalFlats
    } = completionStatus;
    const totalPages = Math.ceil(categorizedBuildings.length / buildingsPerPage);
    const startIndex = (currentPage - 1) * buildingsPerPage;
    const currentBuildings = useMemo(() => {
        return categorizedBuildings.slice(startIndex, startIndex + buildingsPerPage);
    }, [categorizedBuildings, startIndex, buildingsPerPage]);
    const handlePageChange = useCallback((page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);
    return (
        <>
            <div className="searchContainer">
                <input
                    type="text"
                    placeholder="Search by Complex Naam or Address"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="searchInput"
                />
                <div className="filterButtons">
                    <button 
                        onClick={() => handleFilterChange('fileUrl')}
                        className={filter === 'fileUrl' ? 'active' : ''}
                    >
                        With File URL <span className="filter-count">({filterCounts.fileUrl || 0})</span>
                    </button>
                    <button 
                        onClick={() => handleFilterChange('laagBouw')}
                        className={filter === 'laagBouw' ? 'active' : ''}
                    >
                        Laag Bouw <span className="filter-count">({filterCounts.laagBouw || 0})</span>
                    </button>
                    <button 
                        onClick={() => handleFilterChange('HB')}
                        className={filter === 'HB' ? 'active' : ''}
                    >
                        HB <span className="filter-count">({filterCounts.HB || 0})</span>
                    </button>
                    <button 
                        onClick={() => handleFilterChange('duplex')}
                        className={filter === 'duplex' ? 'active' : ''}
                    >
                        Duplex <span className="filter-count">({filterCounts.duplex || 0})</span>
                    </button>
                    <button 
                        onClick={() => handleFilterChange('appointment')}
                        className={filter === 'appointment' ? 'active' : ''}
                    >
                        With Appointment <span className="filter-count">({filterCounts.appointment || 0})</span>
                    </button>
                    <button 
                        onClick={() => handleFilterChange('done')}
                        className={filter === 'done' ? 'active' : ''}
                    >
                        Completed <span className="filter-count">({filterCounts.done || 0})</span>
                    </button>
                    <button 
                        onClick={() => handleFilterChange('pending')}
                        className={filter === 'pending' ? 'active' : ''}
                    >
                        Pending <span className="filter-count">({filterCounts.pending || 0})</span>
                    </button>
                    <button 
                        onClick={() => handleFilterChange('noappointment')}
                        className={filter === 'noappointment' ? 'active' : ''}
                    >
                        No Appointment <span className="filter-count">({filterCounts.noappointment || 0})</span>
                    </button>
                    <button 
                        onClick={() => handleFilterChange('blocked')}
                        className={`${filter === 'blocked' ? 'active' : ''} blocked-filter`}
                    >
                        🚫 Blocked <span className="filter-count">({filterCounts.blocked || 0})</span>
                    </button>
                    <button 
                        onClick={() => handleFilterChange('all')}
                        className={filter === 'all' ? 'active' : ''}
                    >
                        All <span className="filter-count">({filterCounts.all || 0})</span>
                    </button>
                    {(filter !== 'all' || searchQuery) && (
                        <button 
                            onClick={clearAllFilters}
                            className="clear-filters"
                            title="Clear all filters and search"
                        >
                            ✕ Clear All
                        </button>
                    )}
                </div>
                <div className="resultsCount">
                    <strong>{totalResults}</strong> results found
                    {isLoading && <span className="loadingIndicator"> • Refreshing...</span>}
                </div>
            </div>
            <div className="completionPercentage">
                {`Completion Status: ${completedFlats} / ${totalFlats} (${completionPercentage}%)`}
            </div>
            {isLoading && !buildings ? (
                <div className="loadingContainer" style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#666'
                }}>
                    Loading buildings...
                </div>
            ) : (
                <div className="buildingsList">
                    {currentBuildings.map((building, index) => {
                        const flats = building.flats || [];
                        const {types, typeString} = categorizeBuilding(flats);
                        const sortedFlats = [...flats].sort(sortFlats);
                        const flatCount = sortedFlats.length;
                        const hbNumber = generateHBNumber(building, sortedFlats);
                        
                        const completedFlats = sortedFlats.filter(flat => flat.fcStatusHas === '2').length;
                        const completionPercentage = flatCount > 0 ? Math.round((completedFlats / flatCount) * 100) : 0;
                        
                        const generateBuildingStructure = (flats, type) => {
                            const totalFlats = flats.length;
                            const floorGroups = {};
                            
                            for (let i = 0; i < totalFlats; i++) {
const floorNumber = i + 1;
floorGroups[floorNumber] = [flats[i]];
                            }
                            
                            const floors = [];
                            
                            const buildingWidth = type === 'Hoog bouw' ? 120 : 
                                                type === 'Duplex' ? 100 : 80;
                            
const sortedFloorNumbers = Object.keys(floorGroups).map(Number).sort((a, b) => b - a);
                            
                            sortedFloorNumbers.forEach((floorNumber, index) => {
                                const floorFlats = floorGroups[floorNumber];
                                const completedFlatsOnFloor = floorFlats.filter(flat => flat.fcStatusHas === '2').length;
                                const floorCompletionPercentage = (completedFlatsOnFloor / floorFlats.length) * 100;
                                const isCompleted = floorCompletionPercentage === 100;
                                const isPartiallyCompleted = floorCompletionPercentage > 0 && floorCompletionPercentage < 100;
                                
                                const floorHeight = type === 'Hoog bouw' ? 45 : 
                                                  type === 'Duplex' ? 40 : 35;
                                
                                floors.push(
                                    <div 
                                        key={floorNumber} 
                                        className={`buildingFloor ${isCompleted ? 'completed' : isPartiallyCompleted ? 'partial' : 'pending'}`}
                                        style={{
                                            height: `${floorHeight}px`,
                                            width: `${buildingWidth}px`,
                                            animationDelay: `${index * 0.2}s`
                                        }}
                                        title={`Floor ${floorNumber} - 1 flat - ${Math.round(floorCompletionPercentage)}% complete`}
                                    >
                                        <div className="floorNumber">{floorNumber}</div>
                                        <div className="floorWindows">
                                            {/* Each floor = 1 flat, so show 1 window representation */}
                                            <div 
                                                className={`window ${floorFlats[0].fcStatusHas === '2' ? 'completed' : 'pending'}`}
                                                style={{animationDelay: `${index * 0.2}s`}}
                                                title={`Flat: ${floorFlats[0].adres} ${floorFlats[0].huisNummer}${floorFlats[0].toevoeging}`}
                                            />
                                        </div>
                                        <div className="floorProgress" style={{width: `${floorCompletionPercentage}%`}} />
                                    </div>
                                );
                            });
                            
                            return (
                                <div className="verticalBuilding">
                                    {floors}
                                    <div className="buildingFoundation" style={{width: `${buildingWidth}px`}}>
                                        <div className="foundationLabel">{`${type} (${totalFlats} flats)`}</div>
                                    </div>
                                </div>
                            );
                        };
                        
                        return (
                            <div key={index} className="buildingContainer">
                                {/* Visual Building Representation */}
                                <div className="buildingVisual">
                                    <div className={`buildingStructure ${typeString.toLowerCase().replace(' ', '')}`}>
                                        {generateBuildingStructure(sortedFlats, typeString)}
                                    </div>
                                    {/* Completion Badge */}
                                    <div className="completionBadge" data-percentage={completionPercentage}>
                                        {completionPercentage}%
                                    </div>
                                </div>
                                
                                {/* Building Information */}
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
                                                {building.flats && building.flats[0]?.complexNaam
                                                    ? building.flats[0].complexNaam
                                                    : building.address
                                                }
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
                                                onClick={() => toggleBlockBuilding(building)}
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
                                            style={{opacity: building.isBlocked ? 0.4 : 1, pointerEvents: building.isBlocked ? 'none' : 'auto'}}>
                                            <img src={pencilIcon} alt="Edit" className="editIcon"/>
                                        </RoleBasedLink>
                                    </div>
                                    <div className="buildingType" data-type={typeString}>
                                        <b>{typeString}</b>
                                    </div>
                                    <div className="flatsWrapper">
                                        {renderFlatLinks(sortedFlats, types, building)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="pagination">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    Previous
                </button>
                {Array.from({length: totalPages}, (_, index) => (
                    <button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        className={currentPage === index + 1 ? 'activePage' : ''}
                    >
                        {index + 1}
                    </button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    Next
                </button>
            </div>
        </>
    );
};
export default BuildingsList;