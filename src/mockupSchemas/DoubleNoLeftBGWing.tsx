// Mockup building layout schema for double wings without left background elements.

import React from 'react';
import { MockupSchemaProps } from './types';

const DoubleNoLeftBGWing: React.FC<MockupSchemaProps> = ({ form }) => {
    return (
        <div>
            <div className="block">
                <div className="mainPart">
                    <div className="flatsContainer">
                        {form?.floors?.map((element, index, array) => {
                            if (index === 0) {
                                return (
                                    <div key={index} className="emptyFlat">
                                        <div className="doubleSideBGLine"></div>
                                    </div>
                                );
                            }
                            if (index === array.length - 1) {
                                return (
                                    <div key={index} className="flat">
                                        <div className="doubleSideTopLine"></div>
                                        <div className="doubleSideEntranceLineLeft"></div>
                                    </div>
                                );
                            }
                            // Middle floors
                            return (
                                <div key={index} className="flat">
                                    <div className="doubleSideAllLine"></div>
                                    <div className="doubleSideEntranceLineLeft"></div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="stairs"></div>
                    <div className="flatsContainer">
                        {form?.floors?.map((element, i, array) => {
                            if (i === 0) {
                                return (
                                    <div key={i} className="flat">
                                        <div className="doubleSideNoBGRightEntrance"></div>
                                    </div>
                                );
                            }
                            if (i === array.length - 1) {
                                return (
                                    <div key={i} className="flat">
                                        <div className="doubleSideEntranceLineRight"></div>
                                    </div>
                                );
                            }
                            // Middle floors
                            return (
                                <div key={i} className="flat">
                                    <div className="doubleSideEntranceLineRight"></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="basement"></div>
            </div>
        </div>
    );
};

export default DoubleNoLeftBGWing;
