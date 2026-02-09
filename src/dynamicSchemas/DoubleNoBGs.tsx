// Building layout schema component for double-sided buildings without background elements.

import React from 'react';
import FlatInputDetails from '../components/FlatInputDetails';
import { SchemaComponentPropsAlt } from './types';

const DoubleNoBGs: React.FC<SchemaComponentPropsAlt> = ({
    form,
    parentIndex,
    building,
    formFields,
    handleFlat,
}) => {
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
                                        <FlatInputDetails
                                            index={index}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlat}
                                        />
                                        <div className="doubleSideTopLine"></div>
                                        <div className="doubleSideEntranceLineLeft"></div>
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
                                        handleFlatDetails={handleFlat}
                                    />
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
                                    <div key={i} className="emptyFlat">
                                    </div>
                                );
                            }
                            if (i === array.length - 1) {
                                return (
                                    <div key={i} className="flat">
                                        <FlatInputDetails
                                            index={i}
                                            parentIndex={parentIndex}
                                            building={building}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlat}
                                        />
                                        <div className="doubleSideEntranceLineRight"></div>
                                    </div>
                                );
                            }
                            // Middle floors
                            return (
                                <div key={i} className="flat">
                                    <FlatInputDetails
                                        index={i}
                                        parentIndex={parentIndex}
                                        building={building}
                                        formFields={formFields}
                                        handleFlatDetails={handleFlat}
                                    />
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

export default DoubleNoBGs;
