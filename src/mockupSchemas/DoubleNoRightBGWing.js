import React from 'react'

const DoubleNoBGsWing = ({form}) => {
    const floors = form.floors.length

    return (
        <div>
            <div className="block">
                <div className="mainPart">
                    <div className="flatsContainer">
                        {form?.floors?.map((element, index, array) => {
                            // on ground floor we need only line on stairs
                            if (index == 0) {
                                return (
                                    <div key={index} className="flat">
                                        {/* {element.floor} */}
                                        {/* <div className="leftFlatLineStairsBG"></div> */}
                                        {/* <div className="leftFlatLineStairs"></div> */}
                                        <div className="doubleSideBGLine"></div>
                                        <div className="doubleSideNoBGLeftEntrance"></div>
                                    </div>
                                )
                            }
                            // on last floor we need a vertical line to be only 42px long
                            // and an entrance line
                            if (index === array.length - 1) {
                                return (
                                    <div key={index} className="flat">
                                        <div className="doubleSideTopLine"></div>
                                        <div className="doubleSideEntranceLineLeft"></div>
                                    </div>
                                )
                            }
                            // on all other floors we need a vertical line on stairs
                            // and an entrance line
                            if (index !== 0 || index === array.length - 1) {
                                return (
                                    <div key={index} className="flat">
                                        <div className="doubleSideAllLine"></div>
                                        <div className="doubleSideEntranceLineLeft"></div>
                                    </div>
                                )
                            }
                        })}
                    </div>
                    <div className="stairs"></div>

                    <div className="flatsContainer">
                        {form?.floors?.map((element, i, array) => {
                            // on ground floor we need only line on stairs
                            if (i == 0) {
                                return (
                                    <div key={i} className="emptyFlat">
                                        {/* {element.floor} */}
                                        {/* <div className="leftFlatLineStairsBG"></div> */}
                                        {/* <div className="leftFlatLineStairs"></div> */}
                                        {/* <div className='doubleSideNoBGsLineStairs'></div> */}
                                    </div>
                                )
                            }
                            // on last floor we need a vertical line to be only 42px long
                            // and an entrance line
                            if (i === array.length - 1) {
                                return (
                                    <div key={i} className="flat">
                                        <div className="doubleSideEntranceLineRight"></div>
                                    </div>
                                )
                            }
                            // on all other floors we need a vertical line on stairs
                            // and an entrance line
                            if (i !== 0 || i === array.length - 1) {
                                return (
                                    <div key={i} className="flat">
                                        <div className="doubleSideEntranceLineRight"></div>
                                    </div>
                                )
                            }
                        })}
                    </div>
                </div>

                <div className="basement"></div>
            </div>
        </div>
    )
}

export default DoubleNoBGsWing
