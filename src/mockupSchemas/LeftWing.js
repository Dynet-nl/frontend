// Mockup building layout schema for left wing configurations.

import React from 'react'
const LeftWing = ({form}) => {
    const floors = form.floors.length
    return (
        <div className="block">
            <div className="mainPart mainPartReversed">
                <div className="stairs"></div>
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        if (index === 0) {
                            return (
                                <div key={index} className="flat">
                                    <div className="leftFlatLineStairs"></div>
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
                {floors > 0 && (
                    <>
                        <div className="leftWingLineShort"></div>
                        <div className="leftWingLineRotated"></div>
                    </>
                )}
            </div>
            <div className="basement"></div>
        </div>
    )
}
export default LeftWing
