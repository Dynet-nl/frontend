// Building layout schema component for left-side flats without background but with stairs.

import React from 'react';
import FlatInputDetails from '../components/FlatInputDetails';
import { SchemaComponentProps } from './types';

const LeftFlatsNoBGStairs: React.FC<SchemaComponentProps> = ({
    form,
    parentIndex,
    building,
    formFields,
    handleFlatDetails,
}) => {
    return (
        <div className="block">
            <div className="mainPart mainPartReversed">
                <div className="stairs"></div>
                <div className="flatsContainer">
                    {form?.floors?.map((element, index, array) => {
                        if (index === 0) {
                            return (
                                <div key={index} className="emptyFlat">
                                    <div className="leftFlatLineStairsStart"></div>
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
                                    <div className="leftFlatLineStairsLast"></div>
                                    <div className="leftFlatEntranceLine"></div>
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
                                <div className="leftFlatLineStairs"></div>
                                <div className="leftFlatEntranceLine"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="basement"></div>
        </div>
    );
};

export default LeftFlatsNoBGStairs;
