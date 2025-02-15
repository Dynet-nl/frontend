import React from 'react'

const RightWingNoBG = ({form}) => {
    return (
        <div className="block">
            <div className="mainPart">
                <div className="stairs"></div>

                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        // on ground floor we need only line on stairs
                        if (index == 0) {
                            return (
                                <div key={index} className="emptyFlat">
                                    <div className="rightFlatLineStairsStart"></div>
                                </div>
                            )
                        }
                        // on last floor we need a vertical line to be only 42px long
                        // and an entrance line
                        if (index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="rightFlatLineStairsLast"></div>
                                    <div className="rightFlatEntranceLine"></div>
                                    {/* {element.floor} */}
                                </div>
                            )
                        }
                        // on all other floors we need a vertical line on stairs
                        // and an entrance line
                        if (index !== 0 || index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="rightFlatLineStairs"></div>
                                    <div className="rightFlatEntranceLine"></div>
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

export default RightWingNoBG
