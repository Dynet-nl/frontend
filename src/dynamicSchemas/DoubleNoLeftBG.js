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
                            
                            if (index == 0) {
                                return (
                                    <div key={index} className="emptyFlat">
                                        
                                        
                                        
                                        <div className="doubleSideBGLine"></div>
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
                                        <div className="doubleSideTopLine"></div>
                                        <div className="doubleSideEntranceLineLeft"></div>
                                    </div>
                                )
                            }
                            
                            
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
                                        
                                        
                                        
                                        
                                    </div>
                                )
                            }
                            
                            
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
