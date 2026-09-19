// Renders the editable floor-plan schema that matches a block's layout type.

import React from 'react';
import BuildingSchema from './schema/BuildingSchema';
import { isShapeKey } from './schema/shapes';
import { Building, FlatDetailsHandler, FormField } from './schema/types';

interface ConditionalFullSchemaProps {
    form: FormField;
    building: Building | null;
    parentIndex: number;
    formFields: FormField[];
    handleFlatDetails: FlatDetailsHandler;
}

const EMPTY_BUILDING: Building = { _id: '', flats: [] };

const ConditionalFullSchema: React.FC<ConditionalFullSchemaProps> = ({
    form,
    building,
    parentIndex,
    formFields,
    handleFlatDetails,
}) => {
    if (!isShapeKey(form.blockType)) return null;
    return (
        <BuildingSchema
            shape={form.blockType}
            form={form}
            editable={{ building: building ?? EMPTY_BUILDING, parentIndex, formFields, handleFlatDetails }}
        />
    );
};

export default ConditionalFullSchema;
