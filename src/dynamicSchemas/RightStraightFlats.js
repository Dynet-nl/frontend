import React from 'react'
import FlatInputDetails from '../components/FlatInputDetails'

const RightStraightFlats = ({
                                form,
                                parentIndex,
                                building,
                                formFields,
                                handleFlatDetails,
                            }) => {
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
                                    <FlatInputDetails
                                        index={index}
                                        parentIndex={parentIndex}
                                        building={building}
                                        formFields={formFields}
                                        handleFlatDetails={handleFlatDetails}
                                    />
                                    <div className="rightStraightFlatBasementLine"></div>
                                    <div className="rightStraightFlatVerticalLine"></div>
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
                                    <div className="rightStraightFlatVerticalLineLast"></div>
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
                                    <div className="rightStraightFlatVerticalLine"></div>
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

export default RightStraightFlats
