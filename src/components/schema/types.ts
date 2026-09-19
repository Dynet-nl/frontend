// Types shared by the building floor-plan schema (editable and read-only rendering).

import { ChangeEvent } from 'react';

export interface Floor {
    floor?: number;
    flat?: string;
    cableNumber?: number | string;
    cableLength?: number | string;
}

export interface FormField {
    blockType?: string;
    floors?: Floor[];
}

export interface Flat {
    _id: string;
    toevoeging?: string;
    adres?: string;
    huisNummer?: string;
}

export interface Building {
    _id: string;
    flats?: Flat[];
}

export type FlatDetailsHandler = (
    event: ChangeEvent<HTMLSelectElement | HTMLInputElement>,
    index: number,
    parentIndex: number
) => void;

/** Props for the read-only preview (layout type picker). */
export interface MockupSchemaProps {
    form: FormField;
}

/** Props for the editable floor plan (flat / cable inputs per floor). */
export interface SchemaComponentProps extends MockupSchemaProps {
    building: Building;
    parentIndex: number;
    formFields: FormField[];
    handleFlatDetails: FlatDetailsHandler;
}
