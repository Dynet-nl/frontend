// Shared TypeScript types for building layout schema components

import { ChangeEvent } from 'react';

export interface Floor {
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
}

export interface Building {
    _id: string;
    flats: Flat[];
}

export interface SchemaComponentProps {
    form: FormField;
    building: Building;
    parentIndex: number;
    formFields: FormField[];
    handleFlatDetails: (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>, index: number, parentIndex: number) => void;
}

// Some components use 'handleFlat' instead of 'handleFlatDetails'
export interface SchemaComponentPropsAlt {
    form: FormField;
    building: Building;
    parentIndex: number;
    formFields: FormField[];
    handleFlat: (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>, index: number, parentIndex: number) => void;
}

// Mockup schema props (no input handling, just display)
export interface MockupSchemaProps {
    form: FormField;
}
