import React, { useState } from 'react';
import RoleBasedLink from './RoleBasedLink';
import { Link } from 'react-router-dom';
import '../styles/buildingsList.css';
import pencilIcon from '../assets/pencil_edit.png'; // Import the pencil icon image

const BuildingsList = ({ buildings }) => {
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
    const prefixCounts = flats.reduce((acc, flat) => {
      const [prefix] = flat.zoeksleutel.split('_');
      if (!acc[prefix]) {
        acc[prefix] = { count: 0, complexNaam: flat.complexNaam };
      }
      acc[prefix].count += 1;
      return acc;
    }, {});

    const types = Object.entries(prefixCounts).map(([prefix, { count, complexNaam }]) => {
      if (count === 1) return { type: 'Laag bouw', prefix };
      if (count === 2) return { type: 'Duplex', prefix };
      return { type: 'HB', prefix };
    });

    const typeString = types.map(t => t.type).join(', ');
    return { types, typeString };
  };

  const filterBuildings = (buildings, query) => {
    let filteredBuildings = buildings;
    if (query) {
      filteredBuildings = buildings.filter((building) =>
        building.address.toLowerCase().includes(query) ||
        building.flats.some((flat) => flat.complexNaam.toLowerCase().includes(query))
      );
    }

    switch (filter) {
      case 'fileUrl':
        return filteredBuildings.filter(building => building.fileUrl);
      case 'laagBouw':
        return filteredBuildings.filter(building =>
          categorizeBuilding(building.flats).types.some(type => type.type === 'Laag bouw')
        );
      case 'HB':
        return filteredBuildings.filter(building =>
          categorizeBuilding(building.flats).types.some(type => type.type === 'HB')
        );
      case 'appointment':
        return filteredBuildings.filter(building =>
          building.flats.some(flat => flat.technischePlanning?.appointmentBooked?.date)
        );
      default:
        return filteredBuildings;
    }
  };

  const categorizedBuildings = filterBuildings(buildings, searchQuery); // Filtered and categorized buildings
  const totalResults = categorizedBuildings.length; // Count of results

  const sortFlats = (a, b) => {
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

    if (isANumeric) {
      return -1;
    }

    return 1;
  };

  const renderFlatLink = (flat, flatIndex, types, building) => {
    const flatType = types.find(type => flat.zoeksleutel.startsWith(type.prefix));

    // Check if the flat has an appointment
    const hasAppointment = flat.technischePlanning?.appointmentBooked?.date;

    // Apply CSS class based on appointment status
    const flatClassName = hasAppointment ? 'flatLink flatWithAppointment' : 'flatLink';

    if (flatType && flatType.type === 'Laag bouw') {
      return flatIndex === 0 ? (
        <RoleBasedLink key={flatIndex} flatId={flat._id} className={flatClassName}>
          <div key={flatIndex} className="flatInfo">{building.address}</div>
        </RoleBasedLink>
      ) : null;
    } else {
      return (
        <RoleBasedLink key={flatIndex} flatId={flat._id} className={flatClassName}>
          <div className="flatInfo" style={{ backgroundColor: hasAppointment ? 'lightgreen' : 'inherit' }}>Apartment: {flat.complexNaam} -- <b>{flat.toevoeging}</b></div>
        </RoleBasedLink>
      );
    }
  };

  const calculateCompletionPercentage = (buildings) => {
    let totalFlats = 0;
    let completedFlats = 0;

    buildings.forEach(building => {
      totalFlats += building.flats.length;
      completedFlats += building.flats.filter(flat => flat.FCStatusHAS === "2").length;
    });

    return totalFlats > 0 ? ((completedFlats / totalFlats) * 100).toFixed(2) : 0;
  };

  const completionPercentage = calculateCompletionPercentage(categorizedBuildings);

  // Pagination logic
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
          <button onClick={() => handleFilterChange('appointment')}>With Appointment</button>
          <button onClick={() => handleFilterChange('all')}>All</button>
        </div>
        {/* Add a section to show the count of results */}
        <div className="resultsCount">
          <strong>{totalResults}</strong> results found
        </div>
      </div>

      <div className="completionPercentage">
        {`Completion Percentage: ${completionPercentage}%`}
      </div>

      <div className="buildingsList">
        {currentBuildings.map((building, index) => {
          const { types, typeString } = categorizeBuilding(building.flats);
          const sortedFlats = [...building.flats].sort(sortFlats);
          const flatCount = sortedFlats.length;

          // Check if HB type exists and get the HB number if applicable
          const hbType = types.find(type => type.type === 'HB');
          const displayText = hbType
            ? `HB: ${hbType.prefix}` // Display HB number if the building has an HB type
            : building.address;      // Display address if it's Laagbouw or Duplex

          return (
            <div key={index} className="buildingContainer">
              <div className="buildingHeaderSection">
                <Link to={`/building/${building._id}`}>
                  <div className="buildingHeader">{displayText}</div>
                </Link>
                <div className="flatCountBox">{flatCount}</div>
                
                {/* Show pencil icon only for non-Laag-bouw buildings */}
                {types.some(type => type.type !== 'Laag bouw') && (
                  <Link to={`/planning-apartment-schedule/${building._id}`}>
                    <img src={pencilIcon} alt="Edit" className="editIcon" />
                  </Link>
                )}
              </div>
              <div className="buildingType"><b>{typeString}</b></div>
              <div className="flatsWrapper">
                {sortedFlats.map((flat, flatIndex) => renderFlatLink(flat, flatIndex, types, building))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="pagination">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
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
