// Mockup building layout schema for configurations without stair elements.

import React from 'react';
import { MockupSchemaProps } from './types';

const NoStairs: React.FC<MockupSchemaProps> = ({ form }) => {
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
                            );
                        }
                        // Last floor
                        return (
                            <div key={index} className="flat">
                                <div className="noStairsLineHighestFlat"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="basement"></div>
        </div>
    );
};

export default NoStairs;
