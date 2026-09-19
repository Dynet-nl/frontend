// Type definitions and constants for building layout configuration (blocks, floors, cables).

import React from 'react';
import type { MockupSchemaProps } from '../components/schema/types';

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
    complexNaam?: string;
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
    isBlocked?: boolean;
    blockReason?: string;
}

export interface BlockTypeInfo {
    value: string;
    label: string;
    description: string;
    Component: React.ComponentType<MockupSchemaProps>;
    icon: string;
}

export interface BlockTypeCategory {
    name: string;
    description: string;
    types: BlockTypeInfo[];
}

export const FLOOR_OPTIONS = [
    { value: '', label: 'Select floor' },
    { value: 0, label: 'BG (Ground floor)' },
    { value: 1, label: '1st floor' },
    { value: 2, label: '2nd floor' },
    { value: 3, label: '3rd floor' },
    { value: 4, label: '4th floor' },
    { value: 5, label: '5th floor' },
];

export const INITIAL_BLOCK: BlockConfig = {
    firstFloor: 0,
    topFloor: '',
    blockType: '',
    floors: [],
};

/**
 * Builds the floor list for a block from firstFloor..topFloor, keeping any flat/cable
 * assignments already made for floors that still exist.
 */
export const buildFloors = (firstFloor: number, topFloor: number | string, existing: FloorConfig[] = []): FloorConfig[] => {
    if (topFloor === '' || topFloor === null || topFloor === undefined) return existing;
    const top = Number(topFloor);
    const first = Number(firstFloor);
    if (Number.isNaN(top) || Number.isNaN(first) || top < first) return existing;
    const floors: FloorConfig[] = [];
    for (let i = first; i <= top; i++) {
        floors.push(existing.find((f) => f.floor === i) ?? { floor: i });
    }
    return floors;
};
