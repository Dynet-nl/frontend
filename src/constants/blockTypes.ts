// Block type catalogue for building layouts: label/description per shape plus a read-only
// preview component (the picker) bound to that shape.

import { mockupFor } from '../components/schema/BuildingSchema';
import { ShapeKey } from '../components/schema/shapes';
import { BlockTypeCategory, BlockTypeInfo } from '../types/building';

const type = (value: ShapeKey, label: string, description: string, icon: string): BlockTypeInfo => ({
    value,
    label,
    description,
    icon,
    Component: mockupFor(value),
});

export const BLOCK_TYPE_CATEGORIES: BlockTypeCategory[] = [
    {
        name: 'Standard Wings',
        description: 'Building sections with stairwell on one side',
        types: [
            type('leftWing', 'Left Wing', 'Stairs on the left, flats on the right', '⬅️'),
            type('rightWing', 'Right Wing', 'Stairs on the right, flats on the left', '➡️'),
            type('noStairs', 'No Stairs', 'Flats stacked vertically without a stairwell', '🏢'),
        ],
    },
    {
        name: 'Apartment Blocks',
        description: 'Separate apartment-style units per floor',
        types: [
            type('leftWingApart', 'Left Apart', 'Left-side apartment block', '🏠'),
            type('rightWingApart', 'Right Apart', 'Right-side apartment block', '🏠'),
        ],
    },
    {
        name: 'No Ground Floor',
        description: 'Wings where the ground floor (BG) is excluded',
        types: [
            type('leftWingNoBG', 'Left No BG', 'Left wing, no ground floor unit', '◀️'),
            type('rightWingNoBG', 'Right No BG', 'Right wing, no ground floor unit', '▶️'),
        ],
    },
    {
        name: 'Flat Layouts',
        description: 'Straight/flat cable routing without angled connections',
        types: [
            type('leftWingFlat', 'Left Flat', 'Left wing with straight cable path', '📐'),
            type('rightWingFlat', 'Right Flat', 'Right wing with straight cable path', '📐'),
        ],
    },
    {
        name: 'Double Wings',
        description: 'Two wings sharing a stairwell',
        types: [
            type('doubleNoBGsWing', 'Double No BGs', 'Both wings skip ground floor', '🔄'),
            type('doubleNoLeftBGWing', 'Double No Left BG', 'Left wing skips ground floor', '↔️'),
            type('doubleNoRightBGWing', 'Double No Right BG', 'Right wing skips ground floor', '↔️'),
        ],
    },
];

// Flatten for easy lookup
export const ALL_BLOCK_TYPES: BlockTypeInfo[] = BLOCK_TYPE_CATEGORIES.flatMap((cat) => cat.types);

export const getBlockTypeInfo = (blockType: string): BlockTypeInfo | undefined => {
    return ALL_BLOCK_TYPES.find((t) => t.value === blockType);
};
