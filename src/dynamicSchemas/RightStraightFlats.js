// Building layout schema component for right-side straight flat configurations.

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
