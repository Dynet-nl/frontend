// Shared TypeScript types for mockup building layout schema components

export interface Floor {
    flat?: string;
    cableNumber?: number | string;
    cableLength?: number | string;
}

export interface FormField {
    blockType?: string;
    floors?: Floor[];
}

// Mockup schema props (no input handling, just display)
export interface MockupSchemaProps {
    form: FormField;
}
