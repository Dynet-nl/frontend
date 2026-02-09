// Type definitions for building and block configurations

import React from 'react';

export interface FloorConfig {
    floor: number;
    cableNumber?: number;
    cableLength?: number;
    flat?: string;
}

export interface BlockConfig {
    firstFloor: number;
    topFloor: number | string;
    blockType: string;
    floors: FloorConfig[];
}

export interface Flat {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
}

export interface Schedule {
    _id?: string;
    cableNumber?: number;
    date?: string;
    from?: string;
    till?: string;
    flats?: string[];
}

export interface Building {
    _id: string;
    address?: string;
    name?: string;
    postcode?: string;
    flats?: Flat[];
    layout?: {
        blocks?: BlockConfig[];
    };
    schedules?: Schedule[];
}

export interface BlockTypeInfo {
    value: string;
    label: string;
    Component: React.ComponentType<{ form: BlockConfig }>;
    icon: string;
}

export interface BlockTypeCategory {
    name: string;
    types: BlockTypeInfo[];
}

export const FLOOR_OPTIONS = [
    { value: '', label: 'Select floor' },
    { value: 0, label: 'BG' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
];

export const INITIAL_BLOCK: BlockConfig = {
    firstFloor: 0,
    topFloor: '',
    blockType: '',
    floors: [],
};
