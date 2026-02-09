// Mockup building layout schema for right wing flat configurations.

import React from 'react';
import { MockupSchemaProps } from './types';

const RightWingFlat: React.FC<MockupSchemaProps> = ({ form }) => {
    return (
        <div className="block">
            <div className="mainPart">
                <div className="stairs"></div>
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        if (index === 0) {
                            return (
                                <div key={index} className="flat">
                                    <div className="rightStraightFlatBasementLine"></div>
                                    <div className="rightStraightFlatVerticalLine"></div>
                                </div>
                            );
                        }
                        if (index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="rightStraightFlatVerticalLineLast"></div>
                                </div>
                            );
                        }
                        // Middle floors
                        return (
                            <div key={index} className="flat">
                                <div className="rightStraightFlatVerticalLine"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="basement"></div>
        </div>
    );
};

export default RightWingFlat;
