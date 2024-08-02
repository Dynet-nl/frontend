import React, { useState } from 'react';
import RoleBasedLink from './RoleBasedLink';
import { Link } from 'react-router-dom';
import '../styles/buildingsList.css';

const BuildingsList = ({ buildings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // State for filtering criteria

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
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
          building.flats.length === 1 && categorizeBuilding(building.flats).types.some(type => type.type === 'Laag bouw')
        );
      case 'HB':
        return filteredBuildings.filter(building => 
          building.flats.length > 2 && categorizeBuilding(building.flats).types.some(type => type.type !== 'Laag bouw' && type.type !== 'Duplex')
        );
      case 'appointment':
        return filteredBuildings.filter(building => building.appointmentDate || building.appointmentStartTime || building.appointmentEndTime);
      default:
        return filteredBuildings;
    }
  };

  const categorizedBuildings = filterBuildings(buildings, searchQuery);

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
      return { type: 'HB', prefix }; // Changed to 'HB' for more than 2 flats
    });

    const typeString = types.map(t => t.type).join(', ');
    return { types, typeString };
  };

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

    if (flatType && flatType.type === 'Laag bouw') {
      return flatIndex === 0 ? (
        <RoleBasedLink key={flatIndex} flatId={flat._id} className="flatLink">
          <div key={flatIndex} className="flatInfo">{building.address}</div>
        </RoleBasedLink>
      ) : null;
    } else {
      return (
        <RoleBasedLink key={flatIndex} flatId={flat._id} className="flatLink">
          <div className="flatInfo">Apartment: {flat.complexNaam} -- <b>{flat.toevoeging}</b></div>
        </RoleBasedLink>
      );
    }
  };

  const renderBuildingFlats = (flats) => {
    return flats.map((flat, index) => (
      <div key={index} className="flat">
        <div className="checkmarkContainer">
          <span className={flat.FCStatusHAS === "2" ? "greenCheckmark" : "redCheckmark"}>
            &#10004;
          </span>
        </div>
      </div>
    ));
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
      </div>
      <div className="completionPercentage">
        {`Completion Percentage: ${completionPercentage}%`}
      </div>
      {categorizedBuildings.map((building, index) => {
        const { types, typeString } = categorizeBuilding(building.flats);
        const sortedFlats = [...building.flats].sort(sortFlats);
        const flatCount = sortedFlats.length;

        return (
          <div key={index} className="buildingContainer">
            <div className="buildingHeaderSection">
              <Link to={`/building/${building._id}`}>
                <div className="buildingHeader">{building.address}</div>
              </Link>
              <div className="flatCountBox">{flatCount}</div>
              <Link to={`/planning-apartment-schedule/${building._id}`}>
                <button className="viewAllApartmentsButton">View All Apartments</button>
              </Link>
            </div>
            <div className="buildingType"><b>{typeString}</b></div>
            <div className="flatsAndDrawingContainer">
              <div className="sortedFlats">
                {sortedFlats.map((flat, flatIndex) => renderFlatLink(flat, flatIndex, types, building))}
              </div>
              <div className="buildingDrawing">
                {renderBuildingFlats(sortedFlats)}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default BuildingsList;
