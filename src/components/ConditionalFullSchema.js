import React from 'react'
import DoubleNoBGs from '../dynamicSchemas/DoubleNoBGs'
import DoubleNoRightBG from '../dynamicSchemas/DoubleNoRightBG'
import FlatsNoStairs from '../dynamicSchemas/FlatsNoStairs'
import LeftFlatsNoBGStairs from '../dynamicSchemas/LeftFlatsNoBGStairs'
import LeftFlatsStairs from '../dynamicSchemas/LeftFlatsStairs'
import RightFlatsNoBGStairs from '../dynamicSchemas/RightFlatsNoBGStairs'
import RightFlatsStairs from '../dynamicSchemas/RightFlatsStairs'
import DoubleNoLeftBG from '../dynamicSchemas/DoubleNoLeftBG'
import LeftStraightFlats from '../dynamicSchemas/LeftStraightFlats'
import RightStraightFlats from '../dynamicSchemas/RightStraightFlats'
import LeftFlatApart from '../dynamicSchemas/LeftFlatApart'
import RightFlatApart from '../dynamicSchemas/RightFlatApart'

const blockTypeComponents = {
    leftWing: LeftFlatsStairs,
    noStairs: FlatsNoStairs,
    rightWing: RightFlatsStairs,
    leftWingApart: LeftFlatApart,
    rightWingApart: RightFlatApart,
    leftWingNoBG: LeftFlatsNoBGStairs,
    rightWingNoBG: RightFlatsNoBGStairs,
    doubleNoBGsWing: DoubleNoBGs,
    doubleNoRightBGWing: DoubleNoRightBG,
    doubleNoLeftBGWing: DoubleNoLeftBG,
    leftWingFlat: LeftStraightFlats,
    rightWingFlat: RightStraightFlats,
    
};

const ConditionalFullSchema = ({
                                   form,
                                   building,
                                   parentIndex,
                                   formFields,
                                   handleFlatDetails,
                               }) => {
    const Component = blockTypeComponents[form.blockType];

    if (Component) {
        return (
            <Component
                form={form}
                building={building}
                parentIndex={parentIndex}
                formFields={formFields}
                handleFlatDetails={handleFlatDetails}
            />
        );
    }

    
    return null;
};

export default ConditionalFullSchema;
