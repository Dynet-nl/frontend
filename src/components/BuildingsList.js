import React from 'react';
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import '../styles/buildingsList.css';

const BuildingsList = ({ buildings }) => {
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('scrollPosition');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
      sessionStorage.removeItem('scrollPosition');
    }
  }, []);

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
      return { type: complexNaam, prefix };
    });

    const typeString = types.map(t => t.type).join(', ');
    return { types, typeString };
  };

  const handleApartmentClick = () => {
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
  };

  return (
    <>
      {buildings.map((building, index) => {
        const { types, typeString } = categorizeBuilding(building.flats);

        return (
          <div key={index} className="buildingContainer">
            <Link key={index} to={`/building/${building._id}`}>
              <div className="buildingHeader">{building.address}</div>
            </Link>
            <div className="buildingType"><b>{typeString}</b></div>
            {building.flats
              ?.sort((a, b) => {
                const isANumeric = !isNaN(a.toevoeging);
                const isBNumeric = !isNaN(b.toevoeging);

                if (isANumeric && isBNumeric) {
                  return parseInt(a.toevoeging, 10) - parseInt(b.toevoeging, 10);
                }

                if (!isANumeric && !isBNumeric) {
                  return a.toevoeging.localeCompare(b.toevoeging);
                }

                return isANumeric ? -1 : 1;
              })
              .map((flat, flatIndex) => {
                const flatType = types.find(type => flat.zoeksleutel.startsWith(type.prefix));

                if (flatType && flatType.type === 'Laag bouw') {
                  return flatIndex === 0 ? (
                    <Link key={flatIndex} to={`/apartment/${flat._id}`} className="flatLink" onClick={handleApartmentClick}>
                      <div key={flatIndex} className="flatInfo">{building.address}</div>
                    </Link>
                  ) : null;
                } else {
                  return (
                    <Link
                      key={flatIndex}
                      to={`/apartment/${flat._id}`}
                      className="flatLink"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="flatInfo">Apartment: {flat.complexNaam} -- <b>{flat.toevoeging}</b></div>
                    </Link>
                  );
                }
              })}
          </div>
        );
      })}
    </>
  );
};

export default BuildingsList;