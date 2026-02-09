// Mockup building layout schema for right wing apartments with separation elements.

import React from 'react';
import { MockupSchemaProps } from './types';

const RightWingApart: React.FC<MockupSchemaProps> = ({ form }) => {
    return (
        <div className="block">
            <div className="mainPart">
                <div className="stairs"></div>
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        if (index === 0) {
                            return (
                                <div key={index} className="flat">
                                    <div className="rightFlatLineStairsStart"></div>
                                    <div className="rightFlatSeparateLine"></div>
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

export default RightWingApart;
