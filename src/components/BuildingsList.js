// Component displaying paginated building lists with filtering, search functionality, and role-based navigation.

import React, {useContext, useState, useEffect, useMemo, useCallback} from 'react';
import RoleBasedLink from './RoleBasedLink';
import {Link} from 'react-router-dom';
import '../styles/buildingsList.css';
import pencilIcon from '../assets/pencil_edit.png';
import AuthContext from '../context/AuthProvider';
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
    const categorizeBuilding = useCallback((flats) => {
        if (!flats || flats.length === 0) return {types: [], typeString: ''};
        
        // Use actual soortBouw data from flats to determine building type
        const buildingTypes = flats.map(flat => flat.soortBouw).filter(type => type);
        const uniqueBuildingTypes = [...new Set(buildingTypes)];
        
        // If we have actual building type data, use it
        if (uniqueBuildingTypes.length > 0) {
            const typeString = uniqueBuildingTypes.join(', ');
            return {
                types: uniqueBuildingTypes.map(type => ({type, prefix: type})),
                typeString
            };
        }
        
        // Fallback to flat count-based categorization if no soortBouw data
        const totalFlats = flats.length;
        let buildingType;
        
        if (totalFlats === 1) {
            buildingType = 'Laag bouw'; // Single flat = low building
        } else if (totalFlats === 2) {
            buildingType = 'Duplex'; // Two flats = duplex
        } else if (totalFlats <= 4) {
            buildingType = 'Laag bouw'; // 3-4 flats = still low building
        } else {
            buildingType = 'HB'; // 5+ flats = high building (Hoog Bouw)
        }
        
        return {
            types: [{type: buildingType, prefix: buildingType}],
            typeString: buildingType
        };
    }, []);
    const hasTechnischePlanningAppointment = (flat) => {
        return !!flat.technischePlanning?.appointmentBooked?.date;
    };
    const hasHasMonteurAppointment = (flat) => {
        return !!flat.hasMonteur?.appointmentBooked?.date;
    };
    const hasSignatureOrReport = (flat) => {
        return !!(flat.technischePlanning?.signature?.fileUrl ||
            flat.technischePlanning?.report?.fileUrl);
    };
    const filterBuildings = useCallback((buildings, query) => {
        let filteredBuildings = buildings;
        if (!buildings) return [];
        if (query) {
            filteredBuildings = buildings.filter((building) =>
                building.address.toLowerCase().includes(query) ||
                (building.flats && building.flats.some((flat) =>
                    flat.complexNaam && flat.complexNaam.toLowerCase().includes(query)
                ))
            );
        }
        switch (filter) {
            case 'fileUrl':
                return filteredBuildings.filter(building => building.fileUrl);
            case 'laagBouw':
                return filteredBuildings.filter(building =>
                    building.flats && categorizeBuilding(building.flats).types.some(type => type.type === 'Laag bouw')
                );
            case 'HB':
                return filteredBuildings.filter(building =>
                    building.flats && categorizeBuilding(building.flats).types.some(type => type.type === 'HB')
                );
            case 'duplex':
                return filteredBuildings.filter(building =>
                    building.flats && categorizeBuilding(building.flats).types.some(type => type.type === 'Duplex')
                );
            case 'appointment':
                return filteredBuildings.filter(building =>
                        building.flats && building.flats.some(flat =>
                            hasHasMonteurAppointment(flat) || hasTechnischePlanningAppointment(flat)
                        )
                );
            case 'done':
                return filteredBuildings.filter(building =>
                        building.flats && building.flats.some(flat =>
                            flat.fcStatusHas === '2' || hasSignatureOrReport(flat)
                        )
                );
            default:
                return filteredBuildings;
        }
    }, [filter]);
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
        const laagBouwType = types.find(type => type.type === 'Laag bouw');
        if (laagBouwType && flats.length === 1) {
            const laagBouwFlat = flats.find(flat =>
                flat.zoeksleutel && flat.zoeksleutel.startsWith(laagBouwType.prefix)
            );
            if (laagBouwFlat) {
                const hasAppt = hasHasMonteurAppointment(laagBouwFlat) || hasTechnischePlanningAppointment(laagBouwFlat);
                const flatClassName = hasAppt ? 'flatLink flatWithAppointment' : 'flatLink';
                return (
                    <RoleBasedLink key={laagBouwFlat._id} flatId={laagBouwFlat._id} className={flatClassName}>
                        <div className="flatInfo" style={{backgroundColor: hasAppt ? '#90EE90' : 'inherit'}}>
                            {building.address}
                        </div>
                    </RoleBasedLink>
                );
            }
        }
        return flats.map(flat => {
            if (!flat) return null;
            const hasAppt = hasHasMonteurAppointment(flat) || hasTechnischePlanningAppointment(flat);
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
    const calculateCompletionStatus = (buildings) => {
        if (!buildings || buildings.length === 0) return {
            percentage: 0,
            completedFlats: 0,
            totalFlats: 0
        };
        let totalFlats = 0;
        let completedFlats = 0;
        buildings.forEach(building => {
            if (building.flats) {
                totalFlats += building.flats.length;
                completedFlats += building.flats.filter(flat =>
                    flat.fcStatusHas === '2' 
                ).length;
            }
        });
        const percentage = totalFlats > 0 ? ((completedFlats / totalFlats) * 100).toFixed(2) : 0;
        return {
            percentage,
            completedFlats,
            totalFlats
        };
    };
    const categorizedBuildings = useMemo(() => {
        return buildings ? filterBuildings(buildings, searchQuery) : [];
    }, [buildings, searchQuery, filter, filterBuildings]);
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
                        With File URL
                    </button>
                    <button 
                        onClick={() => handleFilterChange('laagBouw')}
                        className={filter === 'laagBouw' ? 'active' : ''}
                    >
                        Laag Bouw
                    </button>
                    <button 
                        onClick={() => handleFilterChange('HB')}
                        className={filter === 'HB' ? 'active' : ''}
                    >
                        HB
                    </button>
                    <button 
                        onClick={() => handleFilterChange('duplex')}
                        className={filter === 'duplex' ? 'active' : ''}
                    >
                        Duplex
                    </button>
                    <button 
                        onClick={() => handleFilterChange('appointment')}
                        className={filter === 'appointment' ? 'active' : ''}
                    >
                        With Appointment
                    </button>
                    <button 
                        onClick={() => handleFilterChange('done')}
                        className={filter === 'done' ? 'active' : ''}
                    >
                        Done
                    </button>
                    <button 
                        onClick={() => handleFilterChange('all')}
                        className={filter === 'all' ? 'active' : ''}
                    >
                        All
                    </button>
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
                        const {types, typeString} = categorizeBuilding(building.flats);
                        const sortedFlats = [...building.flats].sort(sortFlats);
                        const flatCount = sortedFlats.length;
                        
                        // Calculate completion status
                        const completedFlats = sortedFlats.filter(flat => flat.fcStatusHas === '2').length;
                        const completionPercentage = flatCount > 0 ? Math.round((completedFlats / flatCount) * 100) : 0;
                        
                        // Generate building visual representation with actual floors
                        const generateBuildingStructure = (flats, type) => {
                            // Create floors based on actual flat count and logical distribution
                            const totalFlats = flats.length;
                            const floorGroups = {};
                            
                            // Determine logical floor distribution based on building type and flat count
                            let floorsCount;
                            let flatsPerFloor;
                            
                            if (type.includes('Laag bouw') || type.includes('Laag Bouw')) {
                                // Low buildings: 1-2 floors max
                                floorsCount = Math.min(Math.ceil(totalFlats / 2), 2);
                                flatsPerFloor = Math.ceil(totalFlats / floorsCount);
                            } else if (type.includes('Duplex')) {
                                // Duplex: typically 2 floors
                                floorsCount = Math.min(Math.ceil(totalFlats / 1), 2);
                                flatsPerFloor = Math.ceil(totalFlats / floorsCount);
                            } else if (type.includes('HB') || type.includes('Hoog Bouw')) {
                                // High buildings: distribute flats across multiple floors
                                floorsCount = Math.min(Math.ceil(totalFlats / 2), 8); // Max 8 floors
                                flatsPerFloor = Math.ceil(totalFlats / floorsCount);
                            } else {
                                // Default: distribute logically
                                if (totalFlats <= 2) {
                                    floorsCount = totalFlats;
                                    flatsPerFloor = 1;
                                } else if (totalFlats <= 4) {
                                    floorsCount = 2;
                                    flatsPerFloor = Math.ceil(totalFlats / 2);
                                } else {
                                    floorsCount = Math.min(Math.ceil(totalFlats / 2), 6);
                                    flatsPerFloor = Math.ceil(totalFlats / floorsCount);
                                }
                            }
                            
                            // Distribute flats across floors
                            for (let i = 0; i < totalFlats; i++) {
                                const floorNumber = Math.floor(i / flatsPerFloor) + 1;
                                if (!floorGroups[floorNumber]) {
                                    floorGroups[floorNumber] = [];
                                }
                                floorGroups[floorNumber].push(flats[i]);
                            }
                            
                            const floors = [];
                            
                            // Calculate building width once for the entire building
                            const buildingWidth = type.includes('HB') || type.includes('Hoog Bouw') ? 120 : 
                                                type.includes('Duplex') ? 100 : 80;
                            
                            const sortedFloorNumbers = Object.keys(floorGroups).map(Number).sort((a, b) => b - a); // Top to bottom
                            
                            sortedFloorNumbers.forEach((floorNumber, index) => {
                                const floorFlats = floorGroups[floorNumber];
                                const completedFlatsOnFloor = floorFlats.filter(flat => flat.fcStatusHas === '2').length;
                                const floorCompletionPercentage = (completedFlatsOnFloor / floorFlats.length) * 100;
                                const isCompleted = floorCompletionPercentage === 100;
                                const isPartiallyCompleted = floorCompletionPercentage > 0 && floorCompletionPercentage < 100;
                                
                                // Floor height based on building type
                                const floorHeight = type.includes('HB') || type.includes('Hoog Bouw') ? 45 : 
                                                  type.includes('Duplex') ? 40 : 35;
                                
                                floors.push(
                                    <div 
                                        key={floorNumber} 
                                        className={`buildingFloor ${isCompleted ? 'completed' : isPartiallyCompleted ? 'partial' : 'pending'}`}
                                        style={{
                                            height: `${floorHeight}px`,
                                            width: `${buildingWidth}px`,
                                            animationDelay: `${index * 0.2}s`
                                        }}
                                        title={`Floor ${floorNumber} - ${floorFlats.length} flats - ${Math.round(floorCompletionPercentage)}% complete`}
                                    >
                                        <div className="floorNumber">{floorNumber}</div>
                                        <div className="floorWindows">
                                            {floorFlats.slice(0, 4).map((flat, flatIndex) => (
                                                <div 
                                                    key={flat._id} 
                                                    className={`window ${flat.fcStatusHas === '2' ? 'completed' : 'pending'}`}
                                                    style={{animationDelay: `${(index * 0.2) + (flatIndex * 0.1)}s`}}
                                                />
                                            ))}
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
                                <div className="buildingInfo">
                                    <div className="buildingHeaderSection">
                                        <Link to={`/building/${building._id}`}>
                                            <div className="buildingHeader">
                                                {building.flats && building.flats[0]?.complexNaam
                                                    ? building.flats[0].complexNaam
                                                    : building.address
                                                }
                                            </div>
                                        </Link>
                                        <div className="flatCountBox">{flatCount}</div>
                                        <RoleBasedLink
                                            buildingId={building._id}
                                            type="schedule"
                                            className="editIconLink">
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