// Regression guard for the building floor-plan renderer. The snapshots were taken when
// BuildingSchema was proven DOM-identical to the 24 hand-written legacy schema components
// (the only intended difference: the left "flat layout" no longer nests a second `.flat` box).

import React from 'react';
import { render } from '@testing-library/react';
import BuildingSchema, { mockupFor } from '../../components/schema/BuildingSchema';
import { SHAPES, ShapeKey, isShapeKey } from '../../components/schema/shapes';
import { ALL_BLOCK_TYPES } from '../../constants/blockTypes';

const shapes = Object.keys(SHAPES) as ShapeKey[];
const building = { _id: 'b1', flats: [{ _id: 'f1', toevoeging: 'H' }, { _id: 'f2', toevoeging: '1' }] };
const formFor = (n: number, blockType: string) => ({
    blockType,
    floors: Array.from({ length: n }, (_, i) => ({ floor: i, flat: i === 1 ? 'f2' : undefined, cableNumber: i, cableLength: 10 + i })),
});

describe('BuildingSchema', () => {
    it('knows every block type in the catalogue', () => {
        for (const type of ALL_BLOCK_TYPES) {
            expect(isShapeKey(type.value)).toBe(true);
        }
        expect(isShapeKey('bogus')).toBe(false);
        expect(isShapeKey(undefined)).toBe(false);
    });

    it.each(shapes)('%s preview matches snapshot for 0, 1 and 3 floors', (shape) => {
        for (const n of [0, 1, 3]) {
            const { container } = render(<BuildingSchema shape={shape} form={formFor(n, shape)} />);
            expect(container.innerHTML).toMatchSnapshot(`${shape}-preview-${n}`);
        }
    });

    it.each(shapes)('%s editable matches snapshot for 3 floors', (shape) => {
        const form = formFor(3, shape);
        const { container } = render(
            <BuildingSchema shape={shape} form={form} editable={{ building, parentIndex: 0, formFields: [form], handleFlatDetails: jest.fn() }} />
        );
        expect(container.innerHTML).toMatchSnapshot(`${shape}-editable-3`);
    });

    it('renders an editor on every floor that holds a flat, none on empty slots', () => {
        const form = formFor(4, 'leftWingNoBG');
        const { container } = render(
            <BuildingSchema shape="leftWingNoBG" form={form} editable={{ building, parentIndex: 2, formFields: [form], handleFlatDetails: jest.fn() }} />
        );
        expect(container.querySelectorAll('.emptyFlat')).toHaveLength(1);
        expect(container.querySelectorAll('.flat select')).toHaveLength(3);
        expect(container.querySelector('#flat2-1')).not.toBeNull();
    });

    it('double wings render two columns around the stairs and pick the ground floor per side', () => {
        const form = formFor(3, 'doubleNoLeftBGWing');
        const { container } = render(<BuildingSchema shape="doubleNoLeftBGWing" form={form} />);
        const columns = container.querySelectorAll('.flatsContainer');
        expect(columns).toHaveLength(2);
        expect(columns[0].firstElementChild?.className).toBe('emptyFlat');
        expect(columns[1].firstElementChild?.className).toBe('flat');
        expect(container.querySelector('.stairs')?.previousElementSibling).toBe(columns[0]);
    });

    it('mockupFor returns a preview component bound to the shape', () => {
        const Preview = mockupFor('rightWing');
        const { container } = render(<Preview form={formFor(2, 'rightWing')} />);
        expect(container.querySelector('.mainPart')?.className).toBe('mainPart');
        expect(container.querySelectorAll('.rightFlatLineStairs, .rightFlatLineStairsLast')).toHaveLength(2);
        expect(container.querySelector('select')).toBeNull();
    });
});
