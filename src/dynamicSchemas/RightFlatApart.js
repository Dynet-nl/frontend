import React from 'react'
import FlatInputDetails from '../components/FlatInputDetails'

const RightFlatApart = ({
                            form,
                            building,
                            parentIndex,
                            formFields,
                            handleFlatDetails,
                        }) => {
    return (
        <div className="block">
            <div className="mainPart">
                <div className="stairs"></div>

                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
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
                                    <div className="rightFlatLineStairsStart"></div>
                                    <div className="rightFlatSeparateLine"></div>
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
                                    <div className="rightFlatLineStairsLast"></div>
                                    <div className="rightFlatEntranceLine"></div>
                                    
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
                                    <div className="rightFlatLineStairs"></div>
                                    <div className="rightFlatEntranceLine"></div>
                                    
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

export default RightFlatApart
