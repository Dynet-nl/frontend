import React from 'react'
import FlatInputDetails from '../components/FlatInputDetails'

const DoubleNoLeftBG = ({
                            form,
                            parentIndex,
                            building,
                            formFields,
                            handleFlatDetails,
                        }) => {
    return (
        <div>
            <div className="block">
                <div className="mainPart">
                    <div className="flatsContainer">
                        {form?.floors?.map((element, index, array) => {
                            // on ground floor we need only line on stairs
                            if (index == 0) {
                                return (
                                    <div key={index} className="emptyFlat">
                                        {/* {element.floor} */}
                                        {/* <div className="leftFlatLineStairsBG"></div> */}
                                        {/* <div className="leftFlatLineStairs"></div> */}
                                        <div className="doubleSideBGLine"></div>
                                    </div>
                                )
                            }
                            // on last floor we need a vertical line to be only 42px long
                            // and an entrance line
                            if (index === array.length - 1) {
                                return (
                                    <div key={index} className="flat">
                                        <FlatInputDetails
                                            index={index}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
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
                                        <FlatInputDetails
                                            index={index}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
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
                                    <div key={i} className="flat">
                                        <FlatInputDetails
                                            index={i}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
                                        <div className="doubleSideNoBGRightEntrance"></div>
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
                                        <FlatInputDetails
                                            index={i}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
                                        <div className="doubleSideEntranceLineRight"></div>
                                    </div>
                                )
                            }
                            // on all other floors we need a vertical line on stairs
                            // and an entrance line
                            if (i !== 0 || i === array.length - 1) {
                                return (
                                    <div key={i} className="flat">
                                        <FlatInputDetails
                                            index={i}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
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

export default DoubleNoLeftBG
