// Mockup building layout schema for left wing configurations.

import React from 'react';
import { MockupSchemaProps } from './types';

const LeftWing: React.FC<MockupSchemaProps> = ({ form }) => {
    const floors = form.floors?.length || 0;
    return (
        <div className="block">
            <div className="mainPart mainPartReversed">
                <div className="stairs"></div>
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        if (index === 0) {
                            return (
                                <div key={index} className="flat">
                                    <div className="leftFlatLineStairs"></div>
                                </div>
                            );
                        }
                        if (index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="leftFlatLineStairsLast"></div>
                                    <div className="leftFlatEntranceLine"></div>
                                </div>
                            );
                        }
                        // Middle floors
                        return (
                            <div key={index} className="flat">
                                <div className="leftFlatLineStairs"></div>
                                <div className="leftFlatEntranceLine"></div>
                            </div>
                        );
                    })}
                </div>
                {floors > 0 && (
                    <>
                        <div className="leftWingLineShort"></div>
                        <div className="leftWingLineRotated"></div>
                    </>
                )}
            </div>
            <div className="basement"></div>
        </div>
    );
};

export default LeftWing;
