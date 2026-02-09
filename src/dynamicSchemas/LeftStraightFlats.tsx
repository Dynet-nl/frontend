// Building layout schema component for left-side straight flat configurations.

import React from 'react';
import FlatInputDetails from '../components/FlatInputDetails';
import { SchemaComponentProps } from './types';

const LeftStraightFlats: React.FC<SchemaComponentProps> = ({
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
                                <div key={index} className="flat">
                                    <div className="flat">
                                        <FlatInputDetails
                                            index={index}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
                                    </div>
                                    <div className="leftStraightFlatBasementLine"></div>
                                    <div className="leftStraightFlatVerticalLine"></div>
                                </div>
                            );
                        }
                        if (index === array.length - 1) {
                            return (
                                <div key={index} className="flat">
                                    <div className="flat">
                                        <FlatInputDetails
                                            index={index}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
                                    </div>
                                    <div className="leftStraightFlatVerticalLineLast"></div>
                                </div>
                            );
                        }
                        // Middle floors
                        return (
                            <div key={index} className="flat">
                                <div className="flat">
                                    <FlatInputDetails
                                        index={index}
                                        parentIndex={parentIndex}
                                        building={building}
                                        formFields={formFields}
                                        handleFlatDetails={handleFlatDetails}
                                    />
                                </div>
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

export default LeftStraightFlats;
