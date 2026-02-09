// Building layout schema component for right-side flats with stair elements.

import React from 'react';
import FlatInputDetails from '../components/FlatInputDetails';
import { SchemaComponentProps } from './types';

const RightFlatsStairs: React.FC<SchemaComponentProps> = ({
    form,
    parentIndex,
    building,
    formFields,
    handleFlatDetails,
}) => {
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
                                    <FlatInputDetails
                                        index={index}
                                        parentIndex={parentIndex}
                                        building={building}
                                        formFields={formFields}
                                        handleFlatDetails={handleFlatDetails}
                                    />
                                    <div className="rightFlatLineStairs"></div>
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

export default RightFlatsStairs;
