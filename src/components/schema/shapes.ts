// Declarative description of every building layout type.
//
// A shape is one `.block` with a `.mainPart` holding one or two `.flatsContainer` columns.
// Each column says what to draw for the bottom floor (`first`), the top floor (`last`) and
// every floor in between (`middle`): the CSS line classes that draw the cable path, and
// whether the slot is an `.emptyFlat` (no unit there, e.g. a wing without a ground floor).
// The CSS for these classes lives in styles/mockupSchemas.css + styles/dynamicSchemas.css.
//
// Resolution order per floor: `first` (if defined) for index 0, then `last`, then `middle`.
// A shape without `first` therefore draws the `last` variant for a single-floor block.

export interface FloorSpec {
    /** Render `.emptyFlat` (no flat input) instead of `.flat`. */
    empty?: boolean;
    /** CSS classes of the line elements drawn inside the slot, in order. */
    lines: string[];
}

export interface ColumnSpec {
    first?: FloorSpec;
    middle: FloorSpec;
    last: FloorSpec;
}

export interface ShapeSpec {
    /** Mirror the block (`.mainPartReversed`): stairs on the left, flats on the right. */
    reversed?: boolean;
    /** Double wings wrap the block in an extra div (the CSS positions them differently). */
    outerWrapper?: boolean;
    /** Where the `.stairs` element sits: before the first column, or between the two columns. */
    stairs?: 'before' | 'between';
    columns: ColumnSpec[];
    /** Extra line elements after the columns, only drawn when the block has floors. */
    wingLines?: string[];
}

const stairsWing = (side: 'left' | 'right'): ShapeSpec => ({
    reversed: side === 'left',
    stairs: 'before',
    columns: [
        {
            first: { lines: [`${side}FlatLineStairs`] },
            middle: { lines: [`${side}FlatLineStairs`, `${side}FlatEntranceLine`] },
            last: { lines: [`${side}FlatLineStairsLast`, `${side}FlatEntranceLine`] },
        },
    ],
    wingLines: [`${side}WingLineShort`, `${side}WingLineRotated`],
});

const apartWing = (side: 'left' | 'right'): ShapeSpec => ({
    reversed: side === 'left',
    stairs: 'before',
    columns: [
        {
            first: {
                lines: side === 'left'
                    ? ['leftFlatSeparateLine', 'leftFlatLineStairsStart']
                    : ['rightFlatLineStairsStart', 'rightFlatSeparateLine'],
            },
            middle: { lines: [`${side}FlatLineStairs`, `${side}FlatEntranceLine`] },
            last: { lines: [`${side}FlatLineStairsLast`, `${side}FlatEntranceLine`] },
        },
    ],
});

const noGroundFloorWing = (side: 'left' | 'right'): ShapeSpec => ({
    reversed: side === 'left',
    stairs: 'before',
    columns: [
        {
            first: { empty: true, lines: [`${side}FlatLineStairsStart`] },
            middle: { lines: [`${side}FlatLineStairs`, `${side}FlatEntranceLine`] },
            last: { lines: [`${side}FlatLineStairsLast`, `${side}FlatEntranceLine`] },
        },
    ],
});

const straightWing = (side: 'left' | 'right'): ShapeSpec => ({
    reversed: side === 'left',
    stairs: 'before',
    columns: [
        {
            first: { lines: [`${side}StraightFlatBasementLine`, `${side}StraightFlatVerticalLine`] },
            middle: { lines: [`${side}StraightFlatVerticalLine`] },
            last: { lines: [`${side}StraightFlatVerticalLineLast`] },
        },
    ],
});

// Left column of every double wing: bottom slot may or may not have a flat.
const doubleLeftColumn = (groundFloor: boolean): ColumnSpec => ({
    first: groundFloor
        ? { lines: ['doubleSideBGLine', 'doubleSideNoBGLeftEntrance'] }
        : { empty: true, lines: ['doubleSideBGLine'] },
    middle: { lines: ['doubleSideAllLine', 'doubleSideEntranceLineLeft'] },
    last: { lines: ['doubleSideTopLine', 'doubleSideEntranceLineLeft'] },
});

const doubleRightColumn = (groundFloor: boolean): ColumnSpec => ({
    first: groundFloor ? { lines: ['doubleSideNoBGRightEntrance'] } : { empty: true, lines: [] },
    middle: { lines: ['doubleSideEntranceLineRight'] },
    last: { lines: ['doubleSideEntranceLineRight'] },
});

const doubleWing = (leftGroundFloor: boolean, rightGroundFloor: boolean): ShapeSpec => ({
    outerWrapper: true,
    stairs: 'between',
    columns: [doubleLeftColumn(leftGroundFloor), doubleRightColumn(rightGroundFloor)],
});

export const SHAPES = {
    leftWing: stairsWing('left'),
    rightWing: stairsWing('right'),
    noStairs: {
        columns: [
            {
                middle: { lines: ['noStairsLineAllFlats'] },
                last: { lines: ['noStairsLineHighestFlat'] },
            },
        ],
    } as ShapeSpec,
    leftWingApart: apartWing('left'),
    rightWingApart: apartWing('right'),
    leftWingNoBG: noGroundFloorWing('left'),
    rightWingNoBG: noGroundFloorWing('right'),
    leftWingFlat: straightWing('left'),
    rightWingFlat: straightWing('right'),
    doubleNoBGsWing: doubleWing(false, false),
    doubleNoLeftBGWing: doubleWing(false, true),
    doubleNoRightBGWing: doubleWing(true, false),
} as const satisfies Record<string, ShapeSpec>;

export type ShapeKey = keyof typeof SHAPES;

export const isShapeKey = (value: string | undefined): value is ShapeKey =>
    value !== undefined && Object.prototype.hasOwnProperty.call(SHAPES, value);
