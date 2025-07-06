import React from 'react'

const DoubleNoBGsWing = ({form}) => {
    const floors = form.floors.length

    return (
        <div>
            <div className="block">
                <div className="mainPart">
                    <div className="flatsContainer">
                        {form?.floors?.map((element, index, array) => {
                            
                            if (index == 0) {
                                return (
                                    <div key={index} className="flat">
                                        
                                        
                                        
                                        <div className="doubleSideBGLine"></div>
                                        <div className="doubleSideNoBGLeftEntrance"></div>
                                    </div>
                                )
                            }
                            
                            
                            if (index === array.length - 1) {
                                return (
                                    <div key={index} className="flat">
                                        <div className="doubleSideTopLine"></div>
                                        <div className="doubleSideEntranceLineLeft"></div>
                                    </div>
                                )
                            }
                            
                            
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
                            
                            if (i == 0) {
                                return (
                                    <div key={i} className="emptyFlat">
                                        
                                        
                                        
                                        
                                    </div>
                                )
                            }
                            
                            
                            if (i === array.length - 1) {
                                return (
                                    <div key={i} className="flat">
                                        <div className="doubleSideEntranceLineRight"></div>
                                    </div>
                                )
                            }
                            
                            
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
