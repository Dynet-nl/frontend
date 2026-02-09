// Mockup building layout schema for right wing without background elements.

import React from 'react';
import { MockupSchemaProps } from './types';

const RightWingNoBG: React.FC<MockupSchemaProps> = ({ form }) => {
    return (
        <div className="block">
            <div className="mainPart">
                <div className="stairs"></div>
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        if (index === 0) {
                            return (
                                <div key={index} className="emptyFlat">
                                    <div className="rightFlatLineStairsStart"></div>
                                </div>
                            );
                        }
                        if (index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="rightFlatLineStairsLast"></div>
                                    <div className="rightFlatEntranceLine"></div>
                                </div>
                            );
                        }
                        // Middle floors
                        return (
                            <div key={index} className="flat">
                                <div className="rightFlatLineStairs"></div>
                                <div className="rightFlatEntranceLine"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="basement"></div>
        </div>
    );
};

export default RightWingNoBG;
