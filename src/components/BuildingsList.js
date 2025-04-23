import React, {useContext, useState, useEffect} from 'react';
import RoleBasedLink from './RoleBasedLink';
import {Link} from 'react-router-dom';
import '../styles/buildingsList.css';
import pencilIcon from '../assets/pencil_edit.png';
import AuthContext from '../context/AuthProvider';
import ROLES_LIST from "../context/roles_list";

const BuildingsList = ({buildings}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const buildingsPerPage = 20;

    const {user} = useContext(AuthContext);

    // For debugging - remove in production
    useEffect(() => {
        if (filter === 'appointment' || filter === 'done') {
            console.log(`Filter applied: ${filter}`);
            console.log('User context:', user);
            console.log('Buildings count:', buildings?.length);

            if (buildings && buildings.length > 0) {
                // Check a few buildings to see if we can find flats with appointments
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

                console.log(`Found ${hasMonteursFound.length} hasMonteur appointments:`, hasMonteursFound);
                console.log(`Found ${technischePlanningsFound.length} technischePlanning appointments:`, technischePlanningsFound);
            }
        }
    }, [filter, buildings, user]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value.toLowerCase());
        setCurrentPage(1);
    };

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const categorizeBuilding = (flats) => {
        if (!flats || flats.length === 0) return {types: [], typeString: ''};

        // Count total flats first
        const totalFlats = flats.length;

        // If more than 2 flats, it should be HB regardless of prefixes
        if (totalFlats > 2) {
            // Still collect prefixes for reference
            const prefixes = flats.reduce((acc, flat) => {
                if (!flat.zoeksleutel) return acc;
                const [prefix] = flat.zoeksleutel.split('_');
                if (!acc.includes(prefix)) {
                    acc.push(prefix);
                }
                return acc;
            }, []);

            return {
                types: prefixes.map(prefix => ({type: 'HB', prefix})),
                typeString: 'HB'
            };
        }

        // For 1-2 flats, use the original logic
        const prefixCounts = flats.reduce((acc, flat) => {
            if (!flat.zoeksleutel) return acc;
            const [prefix] = flat.zoeksleutel.split('_');
            if (!acc[prefix]) {
                acc[prefix] = {count: 0, complexNaam: flat.complexNaam};
            }
            acc[prefix].count += 1;
            return acc;
        }, {});

        const types = Object.entries(prefixCounts).map(([prefix, {count, complexNaam}]) => {
            if (count === 1) return {type: 'Laag bouw', prefix};
            if (count === 2) return {type: 'Duplex', prefix};
            return {type: 'HB', prefix}; // This would now only happen for a single prefix with 3+ flats
        });

        // Create a single string of unique building types
        const uniqueTypes = [...new Set(types.map(t => t.type))];
        const typeString = uniqueTypes.join(', ');

        return {types, typeString};
    };

    // Helper function to check if a flat has a technischePlanning appointment
    const hasTechnischePlanningAppointment = (flat) => {
        return !!flat.technischePlanning?.appointmentBooked?.date;
    };

    // Helper function to check if a flat has a hasMonteur appointment
    const hasHasMonteurAppointment = (flat) => {
        return !!flat.hasMonteur?.appointmentBooked?.date;
    };

    // Helper function to check if a flat has signature or report
    const hasSignatureOrReport = (flat) => {
        return !!(flat.technischePlanning?.signature?.fileUrl ||
            flat.technischePlanning?.report?.fileUrl);
    };

    // Function to determine if the user has a specific role
    const hasRole = (roleName) => {
        if (!user || !user.roles) return false;
        return user.roles[roleName] === ROLES_LIST[roleName];
    };

    const filterBuildings = (buildings, query) => {
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
                // For now, show all buildings with any appointments since role detection isn't working
                // We'll investigate the role issue separately
                console.log("Showing all buildings with any appointments (user role issue will be fixed)");

                return filteredBuildings.filter(building =>
                        building.flats && building.flats.some(flat =>
                            hasHasMonteurAppointment(flat) || hasTechnischePlanningAppointment(flat)
                        )
                );

            /* Original role-specific code - left for reference
            if (hasRole('HASPlanning')) {
                console.log("Filtering with appointments for HASPlanning role - checking hasMonteur appointments");
                return filteredBuildings.filter(building =>
                    building.flats && building.flats.some(flat => hasHasMonteurAppointment(flat))
                );
            } else {
                console.log("Filtering with appointments for non-HASPlanning role - checking technischePlanning appointments");
                return filteredBuildings.filter(building =>
                    building.flats && building.flats.some(flat => hasTechnischePlanningAppointment(flat))
                );
            }
            */
            case 'done':
                // For now, show any "done" flats based on either role criteria
                console.log("Showing all 'done' buildings based on any criteria (user role issue will be fixed)");

                return filteredBuildings.filter(building =>
                        building.flats && building.flats.some(flat =>
                            flat.fcStatusHas === '2' || hasSignatureOrReport(flat)
                        )
                );

            /* Original role-specific code - left for reference
            if (hasRole('HASPlanning')) {
                console.log("Applying HASPlanning filter: fcStatusHas === '2'");
                return filteredBuildings.filter(building =>
                    building.flats && building.flats.some(flat =>
                        flat.fcStatusHas === '2'
                    )
                );
            } else if (hasRole('TechnischePlanning')) {
                console.log("Applying TechnischePlanning filter: signature or report");
                return filteredBuildings.filter(building =>
                    building.flats && building.flats.some(flat => hasSignatureOrReport(flat))
                );
            }

            console.log("No matching role for 'done' filter");
            return [];
            */
            default:
                return filteredBuildings;
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

        // Check if this is a Laag bouw building (only has one flat)
        const laagBouwType = types.find(type => type.type === 'Laag bouw');
        if (laagBouwType && flats.length === 1) {
            const laagBouwFlat = flats.find(flat =>
                flat.zoeksleutel && flat.zoeksleutel.startsWith(laagBouwType.prefix)
            );

            if (laagBouwFlat) {
                // Check for any appointment (regardless of role for now)
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

        // For other building types (HB, Duplex), or if the above didn't return, show each flat separately
        return flats.map(flat => {
            if (!flat) return null;

            // Check for any appointment (regardless of role for now)
            const hasAppt = hasHasMonteurAppointment(flat) || hasTechnischePlanningAppointment(flat);
            const flatClassName = hasAppt ? 'flatLink flatWithAppointment' : 'flatLink';

            // Create a formatted display for the apartment that includes more details
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
                    flat.fcStatusHas === '2' // Changed to check fcStatusHas
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

    const categorizedBuildings = buildings ? filterBuildings(buildings, searchQuery) : [];
    const totalResults = categorizedBuildings.length;
    const {
        percentage: completionPercentage,
        completedFlats,
        totalFlats
    } = calculateCompletionStatus(categorizedBuildings);

    const totalPages = Math.ceil(categorizedBuildings.length / buildingsPerPage);
    const startIndex = (currentPage - 1) * buildingsPerPage;
    const currentBuildings = categorizedBuildings.slice(startIndex, startIndex + buildingsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

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
                    <button onClick={() => handleFilterChange('fileUrl')}>With File URL</button>
                    <button onClick={() => handleFilterChange('laagBouw')}>Laag Bouw</button>
                    <button onClick={() => handleFilterChange('HB')}>HB</button>
                    <button onClick={() => handleFilterChange('duplex')}>Duplex</button>
                    <button onClick={() => handleFilterChange('appointment')}>With Appointment</button>
                    <button onClick={() => handleFilterChange('done')}>Done</button>
                    <button onClick={() => handleFilterChange('all')}>All</button>
                </div>
                <div className="resultsCount">
                    <strong>{totalResults}</strong> results found
                </div>
            </div>

            <div className="completionPercentage">
                {`Completion Status: ${completedFlats} / ${totalFlats} (${completionPercentage}%)`}
            </div>

            <div className="buildingsList">
                {currentBuildings.map((building, index) => {
                    const {types, typeString} = categorizeBuilding(building.flats);
                    const sortedFlats = [...building.flats].sort(sortFlats);
                    const flatCount = sortedFlats.length;

                    const hbType = types.find(type => type.type === 'HB');
                    const displayText = hbType
                        ? `HB: ${hbType.prefix}`
                        : building.address;

                    return (
                        <div key={index} className="buildingContainer">
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
                            <div className="buildingType"><b>{typeString}</b></div>
                            <div className="flatsWrapper">
                                {renderFlatLinks(sortedFlats, types, building)}
                            </div>
                        </div>
                    );
                })}
            </div>

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