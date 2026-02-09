// Building layout schema component for right-side flats without background but with stairs.

import React from 'react';
import FlatInputDetails from '../components/FlatInputDetails';
import { SchemaComponentProps } from './types';

const RightFlatsNoBGStairs: React.FC<SchemaComponentProps> = ({
    form,
    parentIndex,
    building,
    formFields,
    handleFlatDetails,
}) => {
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
                                    <FlatInputDetails
                                        index={index}
                                        parentIndex={parentIndex}
                                        building={building}
                                        formFields={formFields}
                                        handleFlatDetails={handleFlatDetails}
                                    />
                                    <div className="rightFlatLineStairsLast"></div>
                                    <div className="rightFlatEntranceLine"></div>
                                </div>
                            );
                        }
                        // Middle floors
                        return (
                            <div key={index} className="flat">
                                <FlatInputDetails
                                    index={index}
                                    parentIndex={parentIndex}
                                    building={building}
                                    formFields={formFields}
                                    handleFlatDetails={handleFlatDetails}
                                />
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

export default RightFlatsNoBGStairs;
