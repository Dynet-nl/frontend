import React, { useEffect } from 'react'

const DistrictButtons = ({ districts, getBuildings, setCurrentDistrict }) => {
  return (
    <div>
      {districts &&
        districts.map((district, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentDistrict(district)
              getBuildings(district._id)
            }}
          >
            {district.name}
          </button>
        ))}
    </div>
  )
}

export default DistrictButtons
