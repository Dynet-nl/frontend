import React from 'react'
import FlatInputDetails from '../components/FlatInputDetails'

const LeftStraightFlats = ({
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
                        
                        if (index == 0) {
                            return (
                                <div key={index} className="flat">
                                    <div key={index} className="flat">
                                        <FlatInputDetails
                                            index={index}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
                                    </div>
                                    <div className="leftStraightFlatBasementLine"></div>
                                    <div className="leftStraightFlatVerticalLine"></div>
                                    
                                </div>
                            )
                        }
                        
                        
                        if (index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div key={index} className="flat">
                                        <FlatInputDetails
                                            index={index}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
                                    </div>
                                    <div className="leftStraightFlatVerticalLineLast"></div>
                                </div>
                            )
                        }
                        
                        
                        if (index !== 0 || index !== array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div key={index} className="flat">
                                        <FlatInputDetails
                                            index={index}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
                                    </div>
                                    <div className="leftStraightFlatVerticalLine"></div>
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

export default LeftStraightFlats
