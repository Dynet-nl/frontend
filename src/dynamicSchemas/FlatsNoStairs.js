import React from 'react'
import FlatInputDetails from '../components/FlatInputDetails'

const FlatsNoStairs = ({
                           form,
                           parentIndex,
                           building,
                           formFields,
                           handleFlatDetails,
                       }) => {
    return (
        <div className="block">
            <div className="mainPart">
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        
                        if (index !== array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <FlatInputDetails
                                        index={index}
                                        parentIndex={parentIndex}
                                        building={building}
                                        formFields={formFields}
                                        handleFlatDetails={handleFlatDetails}
                                    />
                                    <div className="noStairsLineAllFlats"></div>
                                    
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
                                    <div className="noStairsLineHighestFlat"></div>
                                    
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

export default FlatsNoStairs
