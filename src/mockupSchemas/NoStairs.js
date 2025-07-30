// Mockup building layout schema for configurations without stair elements.

import React from 'react'
const NoStairs = ({form}) => {
    return (
        <div className="block">
            <div className="mainPart">
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        if (index !== array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="noStairsLineAllFlats"></div>
                                </div>
                            )
                        }
                        if (index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
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
export default NoStairs
