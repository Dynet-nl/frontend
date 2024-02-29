import React, { useEffect } from 'react'

const DistrictButtons = ({ districts, getBuildings, setCurrentDistrict }) => {
  const handleDistrictClick = (district) => {
    setCurrentDistrict(district);
    getBuildings(district._id);
  };

  return (
    <div>
      {districts.map((district) => (
        <button
          key={district._id}
          onClick={() => handleDistrictClick(district)}
        >
          {district.name}
        </button>
      ))}
    </div>
  );
};

export default DistrictButtons;
