import React from 'react'
import FlatInputDetails from '../components/FlatInputDetails'

const LeftFlatsStairs = ({
                             form,
                             parentIndex,
                             building,
                             formFields,
                             handleFlatDetails,
                         }) => {
    return (
        <div className="block">
            <div className="mainPart mainPartReversed">
                <div className="stairs"></div>

                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        // on ground floor we need only line on stairs
                        if (index === 0) {
                            return (
                                <div key={index} className="flat">
                                    <FlatInputDetails
                                        index={index}
                                        parentIndex={parentIndex}
                                        building={building}
                                        formFields={formFields}
                                        handleFlatDetails={handleFlatDetails}
                                    />

                                    <div className="leftFlatLineStairs"></div>
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
                                    <div className="leftFlatLineStairsLast"></div>
                                    <div className="leftFlatEntranceLine"></div>
                                </div>
                            )
                        }
                        // on all other floors we need a vertical line on stairs
                        // and an entrance line
                        if (index !== 0 || index !== array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <FlatInputDetails
                                        index={index}
                                        parentIndex={parentIndex}
                                        building={building}
                                        formFields={formFields}
                                        handleFlatDetails={handleFlatDetails}
                                    />
                                    <div className="leftFlatLineStairs"></div>
                                    <div className="leftFlatEntranceLine"></div>
                                </div>
                            )
                        }
                    })}
                </div>
                {form.floors.length > 0 && (
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

export default LeftFlatsStairs
