import React, {useState} from 'react';
import RoleBasedLink from './RoleBasedLink';
import {Link} from 'react-router-dom';
import '../styles/buildingsList.css';
import pencilIcon from '../assets/pencil_edit.png';

const BuildingsList = ({buildings}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const buildingsPerPage = 20;

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
            return {type: 'HB', prefix};
        });

        const typeString = types.map(t => t.type).join(', ');
        return {types, typeString};
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
                return filteredBuildings.filter(building =>
                        building.flats && building.flats.some(flat =>
                            flat.technischePlanning?.appointmentBooked?.date
                        )
                );
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

    const renderFlatLink = (flat, flatIndex, types, building) => {
        if (!flat) return null;

        const flatType = types.find(type => flat.zoeksleutel && flat.zoeksleutel.startsWith(type.prefix));
        const hasAppointment = flat.technischePlanning?.appointmentBooked?.date;
        const flatClassName = hasAppointment ? 'flatLink flatWithAppointment' : 'flatLink';

        if (flatType && flatType.type === 'Laag bouw') {
            return flatIndex === 0 ? (
                <RoleBasedLink key={flat._id} flatId={flat._id} className={flatClassName}>
                    <div className="flatInfo" style={{backgroundColor: hasAppointment ? '#90EE90' : 'inherit'}}>
                        {building.address}
                    </div>
                </RoleBasedLink>
            ) : null;
        }

        return (
            <RoleBasedLink key={flat._id} flatId={flat._id} className={flatClassName}>
                <div className="flatInfo" style={{backgroundColor: hasAppointment ? '#90EE90' : 'inherit'}}>
                    Apartment: {flat.complexNaam} -- <b>{flat.toevoeging}</b>
                </div>
            </RoleBasedLink>
        );
    };

    const calculateCompletionPercentage = (buildings) => {
        if (!buildings || buildings.length === 0) return 0;

        let totalFlats = 0;
        let completedFlats = 0;

        buildings.forEach(building => {
            if (building.flats) {
                totalFlats += building.flats.length;
                completedFlats += building.flats.filter(flat =>
                    flat.hasMonteur &&
                    flat.hasMonteur.installation &&
                    flat.hasMonteur.installation.status === 'completed'
                ).length;
            }
        });

        return totalFlats > 0 ? ((completedFlats / totalFlats) * 100).toFixed(2) : 0;
    };

    const categorizedBuildings = buildings ? filterBuildings(buildings, searchQuery) : [];
    const totalResults = categorizedBuildings.length;
    const completionPercentage = calculateCompletionPercentage(categorizedBuildings);

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
                    <button onClick={() => handleFilterChange('all')}>All</button>
                </div>
                <div className="resultsCount">
                    <strong>{totalResults}</strong> results found
                </div>
            </div>

            <div className="completionPercentage">
                {`Completion Percentage: ${completionPercentage}%`}
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

                                <Link to={`/planning-apartment-schedule/${building._id}`}>
                                    <img src={pencilIcon} alt="Edit" className="editIcon"/>
                                </Link>
                            </div>
                            <div className="buildingType"><b>{typeString}</b></div>
                            <div className="flatsWrapper">
                                {sortedFlats.map((flat, flatIndex) => renderFlatLink(flat, flatIndex, types, building))}
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