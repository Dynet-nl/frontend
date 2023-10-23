import React from 'react'

const NoStairs = ({ form }) => {
  return (
    <div className="block">
      <div className="mainPart">
        <div className="flatsContainer">
          {form?.floors?.map((element, index, array) => {
            // all flats expect the highest one
            if (index !== array.length - 1) {
              return (
                <div key={index} className="flat">
                  <div className="noStairsLineAllFlats"></div>
                  {/* others */}
                </div>
              )
            }
            // the highest flat
            if (index === array.length - 1) {
              return (
                <div key={index} className="flat">
                  <div className="noStairsLineHighestFlat"></div>
                  {/* highest */}
                </div>
              )
            }
          })}
        </div>
      </div>
      <div className="basement"></div>
    </div>
  )
}

export default NoStairs
