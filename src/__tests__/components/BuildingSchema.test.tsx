// Regression guard for the building floor-plan renderer: one column of floor slots per
// block (top floor first, basement last), stairs beside or between the columns, and an
// editor only on slots that hold a flat.

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

    it('draws floors top-first with the basement last', () => {
        const { container } = render(<BuildingSchema shape="leftWing" form={formFor(3, 'leftWing')} />);
        const labels = Array.from(container.querySelectorAll('.floor-slot__label')).map((el) => el.textContent);
        expect(labels).toEqual(['2e', '1e', 'BG', 'KB']);
    });

    it('double wings render two columns around the stairs and pick the ground floor per side', () => {
        const form = formFor(3, 'doubleNoLeftBGWing');
        const { container } = render(<BuildingSchema shape="doubleNoLeftBGWing" form={form} />);
        const columns = container.querySelectorAll('.flatsContainer');
        expect(columns).toHaveLength(2);
        // Ground floor is the last floor slot before the basement row.
        const groundLeft = columns[0].querySelector('[data-floor="0"]');
        const groundRight = columns[1].querySelector('[data-floor="0"]');
        expect(groundLeft?.classList.contains('floor-slot--empty')).toBe(true);
        expect(groundRight?.querySelector('.emptyFlat')?.textContent).toContain('Zelfde verdieping');
        expect(container.querySelector('.stairs')?.previousElementSibling).toBe(columns[0]);
    });

    it('puts the stairs on the side the shape says', () => {
        const left = render(<BuildingSchema shape="leftWing" form={formFor(2, 'leftWing')} />).container;
        expect(left.querySelector('.plan__wing')?.firstElementChild?.classList.contains('stairs')).toBe(true);
        const right = render(<BuildingSchema shape="rightWing" form={formFor(2, 'rightWing')} />).container;
        expect(right.querySelector('.plan__wing')?.lastElementChild?.classList.contains('stairs')).toBe(true);
        const none = render(<BuildingSchema shape="noStairs" form={formFor(2, 'noStairs')} />).container;
        expect(none.querySelector('.stairs')).toBeNull();
    });

    it('mockupFor returns a preview component bound to the shape', () => {
        const Preview = mockupFor('rightWing');
        const { container } = render(<Preview form={formFor(2, 'rightWing')} />);
        expect(container.querySelector('.plan__wing')?.getAttribute('data-shape')).toBe('rightWing');
        expect(container.querySelectorAll('.flat')).toHaveLength(2);
        expect(container.querySelector('select')).toBeNull();
    });
});
