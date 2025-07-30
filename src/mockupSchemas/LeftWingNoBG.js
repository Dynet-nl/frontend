// Mockup building layout schema for left wing without background elements.

import React from 'react'
const LeftWingNoBG = ({form}) => {
    return (
        <div className="block">
            <div className="mainPart mainPartReversed">
                <div className="stairs"></div>
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        if (index == 0) {
                            return (
                                <div key={index} className="emptyFlat">
                                    <div className="leftFlatLineStairsStart"></div>
                                </div>
                            )
                        }
                        if (index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="leftFlatLineStairsLast"></div>
                                    <div className="leftFlatEntranceLine"></div>
                                </div>
                            )
                        }
                        if (index !== 0 || index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="leftFlatLineStairs"></div>
                                    <div className="leftFlatEntranceLine"></div>
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
export default LeftWingNoBG
