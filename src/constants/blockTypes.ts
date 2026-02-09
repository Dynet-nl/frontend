// Block type configurations for building layouts

import LeftWing from '../mockupSchemas/LeftWing';
import RightWing from '../mockupSchemas/RightWing';
import NoStairs from '../mockupSchemas/NoStairs';
import LeftWingApart from '../mockupSchemas/LeftWingApart';
import RightWingApart from '../mockupSchemas/RightWingApart';
import LeftWingNoBG from '../mockupSchemas/LeftWingNoBG';
import RightWingNoBG from '../mockupSchemas/RightWingNoBG';
import LeftWingFlat from '../mockupSchemas/LeftWingFlat';
import RightWingFlat from '../mockupSchemas/RightWingFlat';
import DoubleNoBGsWing from '../mockupSchemas/DoubleNoBGsWing';
import DoubleNoLeftBGWing from '../mockupSchemas/DoubleNoLeftBGWing';
import DoubleNoRightBGWing from '../mockupSchemas/DoubleNoRightBGWing';
import { BlockTypeCategory, BlockTypeInfo } from '../types/building';

export const BLOCK_TYPE_CATEGORIES: BlockTypeCategory[] = [
    {
        name: 'Standard Wings',
        types: [
            { value: 'leftWing', label: 'Left Wing', Component: LeftWing, icon: '⬅️' },
            { value: 'rightWing', label: 'Right Wing', Component: RightWing, icon: '➡️' },
            { value: 'noStairs', label: 'No Stairs', Component: NoStairs, icon: '🏢' },
        ],
    },
    {
        name: 'Apartment Blocks',
        types: [
            { value: 'leftWingApart', label: 'Left Apart', Component: LeftWingApart, icon: '🏠' },
            { value: 'rightWingApart', label: 'Right Apart', Component: RightWingApart, icon: '🏠' },
        ],
    },
    {
        name: 'No Background',
        types: [
            { value: 'leftWingNoBG', label: 'Left No BG', Component: LeftWingNoBG, icon: '◀️' },
            { value: 'rightWingNoBG', label: 'Right No BG', Component: RightWingNoBG, icon: '▶️' },
        ],
    },
    {
        name: 'Flat Layouts',
        types: [
            { value: 'leftWingFlat', label: 'Left Flat', Component: LeftWingFlat, icon: '📐' },
            { value: 'rightWingFlat', label: 'Right Flat', Component: RightWingFlat, icon: '📐' },
        ],
    },
    {
        name: 'Double Wings',
        types: [
            { value: 'doubleNoBGsWing', label: 'Double No BGs', Component: DoubleNoBGsWing, icon: '🔄' },
            { value: 'doubleNoLeftBGWing', label: 'Double No Left', Component: DoubleNoLeftBGWing, icon: '↔️' },
            { value: 'doubleNoRightBGWing', label: 'Double No Right', Component: DoubleNoRightBGWing, icon: '↔️' },
        ],
    },
];

// Flatten for easy lookup
export const ALL_BLOCK_TYPES: BlockTypeInfo[] = BLOCK_TYPE_CATEGORIES.flatMap((cat) => cat.types);

export const getBlockTypeInfo = (blockType: string): BlockTypeInfo | undefined => {
    return ALL_BLOCK_TYPES.find((t) => t.value === blockType);
};
