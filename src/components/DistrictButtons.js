import React, { useEffect } from 'react'
import Button from '@mui/material/Button';

const DistrictButtons = ({ districts, getBuildings, setCurrentDistrict }) => {
  const handleDistrictClick = (district) => {
    setCurrentDistrict(district);
    getBuildings(district._id);
  };

  return (
    <div>
      {districts.map((district) => (
        <Button
          key={district._id}
          onClick={() => handleDistrictClick(district)}
          style={{ backgroundColor: 'green', color: 'white' }}
        >
          {district.name}
        </Button>
      ))
      }
    </div >
  );
};

export default DistrictButtons;
