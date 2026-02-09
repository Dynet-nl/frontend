// Mockup building layout schema for left wing flat configurations.

import React from 'react';
import { MockupSchemaProps } from './types';

const LeftWingFlat: React.FC<MockupSchemaProps> = ({ form }) => {
    return (
        <div className="block">
            <div className="mainPart mainPartReversed">
                <div className="stairs"></div>
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        if (index === 0) {
                            return (
                                <div key={index} className="flat">
                                    <div className="leftStraightFlatBasementLine"></div>
                                    <div className="leftStraightFlatVerticalLine"></div>
                                </div>
                            );
                        }
                        if (index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="leftStraightFlatVerticalLineLast"></div>
                                </div>
                            );
                        }
                        // Middle floors
                        return (
                            <div key={index} className="flat">
                                <div className="leftStraightFlatVerticalLine"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="basement"></div>
        </div>
    );
};

export default LeftWingFlat;
