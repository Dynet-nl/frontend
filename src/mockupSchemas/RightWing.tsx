// Mockup building layout schema for right wing configurations.

import React from 'react';
import { MockupSchemaProps } from './types';

const RightWing: React.FC<MockupSchemaProps> = ({ form }) => {
    const floors = form.floors?.length || 0;
    return (
        <div className="block">
            <div className="mainPart">
                <div className="stairs"></div>
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        if (index === 0) {
                            return (
                                <div key={index} className="flat">
                                    <div className="rightFlatLineStairs"></div>
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
                {floors > 0 && (
                    <>
                        <div className="rightWingLineShort"></div>
                        <div className="rightWingLineRotated"></div>
                    </>
                )}
            </div>
            <div className="basement"></div>
        </div>
    );
};

export default RightWing;
