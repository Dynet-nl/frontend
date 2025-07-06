import React from 'react'

const RightWing = ({form}) => {
    const floors = form.floors.length
    return (
        <div className="block">
            <div className="mainPart">
                <div className="stairs"></div>

                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        
                        if (index == 0) {
                            return (
                                <div key={index} className="flat">
                                    <div className="rightFlatLineStairs"></div>
                                </div>
                            )
                        }
                        
                        
                        if (index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="rightFlatLineStairsLast"></div>
                                    <div className="rightFlatEntranceLine"></div>
                                    
                                </div>
                            )
                        }
                        
                        
                        if (index !== 0 || index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="rightFlatLineStairs"></div>
                                    <div className="rightFlatEntranceLine"></div>
                                    
                                </div>
                            )
                        }
                    })}
                </div>
                {floors > 0 && (
                    <>
                        <div className="rightWingLineShort"></div>
                        <div className="rightWingLineRotated"></div>
                    </>
                )}
            </div>
            <div className="basement"></div>
        </div>
    )
}

export default RightWing
