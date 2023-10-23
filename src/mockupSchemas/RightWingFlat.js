import React from 'react'

const RightWingFlat = ({ form }) => {
  return (
    <div className="block">
      <div className="mainPart">
        <div className="stairs"></div>

        <div className="flatsContainer">
          {form?.floors?.map((element, index, array) => {
            // on ground floor we need extra line on basement
            if (index == 0) {
              return (
                <div key={index} className="flat">
                  <div className="rightStraightFlatBasementLine"></div>
                  <div className="rightStraightFlatVerticalLine"></div>
                  {/* <div className="leftFlatEntranceLine"></div>
                  <div className="leftFlatLineStairsStart"></div> */}
                </div>
              )
            }
            // on last floor we need a vertical line to be only 42px long
            // and an entrance line
            if (index === array.length - 1) {
              return (
                <div key={index} className="flat">
                  <div className="rightStraightFlatVerticalLineLast"></div>
                </div>
              )
            }
            // on all other floors we need a vertical line on stairs
            // and an entrance line
            if (index !== 0 || index !== array.length - 1) {
              return (
                <div key={index} className="flat">
                  <div className="rightStraightFlatVerticalLine"></div>
                  {/* <div className="leftFlatLineStairs"></div>
                  <div className="leftFlatEntranceLine"></div> */}
                  {/* {element.floor} */}
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

export default RightWingFlat
