// Component that conditionally renders different building layout schemas based on building configuration.

import React from 'react';
import DoubleNoBGs from '../dynamicSchemas/DoubleNoBGs';
import DoubleNoRightBG from '../dynamicSchemas/DoubleNoRightBG';
import FlatsNoStairs from '../dynamicSchemas/FlatsNoStairs';
import LeftFlatsNoBGStairs from '../dynamicSchemas/LeftFlatsNoBGStairs';
import LeftFlatsStairs from '../dynamicSchemas/LeftFlatsStairs';
import RightFlatsNoBGStairs from '../dynamicSchemas/RightFlatsNoBGStairs';
import RightFlatsStairs from '../dynamicSchemas/RightFlatsStairs';
import DoubleNoLeftBG from '../dynamicSchemas/DoubleNoLeftBG';
import LeftStraightFlats from '../dynamicSchemas/LeftStraightFlats';
import RightStraightFlats from '../dynamicSchemas/RightStraightFlats';
import LeftFlatApart from '../dynamicSchemas/LeftFlatApart';
import RightFlatApart from '../dynamicSchemas/RightFlatApart';

interface Floor {
    flat?: string;
    cableNumber?: number | string;
    cableLength?: number | string;
}

interface FormField {
    blockType?: string;
    floors?: Floor[];
}

interface Flat {
    _id: string;
    toevoeging?: string;
}

interface Building {
    _id: string;
    flats?: Flat[];
}

interface SchemaComponentProps {
    form: FormField;
    building: Building;
    parentIndex: number;
    formFields: FormField[];
    handleFlatDetails: (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>, index: number, parentIndex: number) => void;
}

type BlockType =
    | 'leftWing'
    | 'noStairs'
    | 'rightWing'
    | 'leftWingApart'
    | 'rightWingApart'
    | 'leftWingNoBG'
    | 'rightWingNoBG'
    | 'doubleNoBGsWing'
    | 'doubleNoRightBGWing'
    | 'doubleNoLeftBGWing'
    | 'leftWingFlat'
    | 'rightWingFlat';

const blockTypeComponents: Record<BlockType, React.ComponentType<SchemaComponentProps>> = {
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

interface ConditionalFullSchemaProps {
    form: FormField;
    building: Building;
    parentIndex: number;
    formFields: FormField[];
    handleFlatDetails: (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>, index: number, parentIndex: number) => void;
}

const ConditionalFullSchema: React.FC<ConditionalFullSchemaProps> = ({
    form,
    building,
    parentIndex,
    formFields,
    handleFlatDetails,
}) => {
    const Component = form.blockType ? blockTypeComponents[form.blockType as BlockType] : null;
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
