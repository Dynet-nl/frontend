// Tests for block type constants

import { BLOCK_TYPE_CATEGORIES, ALL_BLOCK_TYPES, getBlockTypeInfo } from '../../constants/blockTypes';

describe('BLOCK_TYPE_CATEGORIES', () => {
    it('should have multiple categories', () => {
        expect(BLOCK_TYPE_CATEGORIES.length).toBeGreaterThan(0);
    });

    it('should have Standard Wings category', () => {
        const standardWings = BLOCK_TYPE_CATEGORIES.find(cat => cat.name === 'Standard Wings');
        expect(standardWings).toBeDefined();
        expect(standardWings?.types.length).toBeGreaterThan(0);
    });

    it('should have Apartment Blocks category', () => {
        const apartmentBlocks = BLOCK_TYPE_CATEGORIES.find(cat => cat.name === 'Apartment Blocks');
        expect(apartmentBlocks).toBeDefined();
    });

    it('should have Double Wings category', () => {
        const doubleWings = BLOCK_TYPE_CATEGORIES.find(cat => cat.name === 'Double Wings');
        expect(doubleWings).toBeDefined();
    });

    it('each category should have name and types', () => {
        BLOCK_TYPE_CATEGORIES.forEach(category => {
            expect(category.name).toBeDefined();
            expect(category.name.length).toBeGreaterThan(0);
            expect(category.types).toBeDefined();
            expect(Array.isArray(category.types)).toBe(true);
        });
    });

    it('each type should have value, label, Component, and icon', () => {
        BLOCK_TYPE_CATEGORIES.forEach(category => {
            category.types.forEach(type => {
                expect(type.value).toBeDefined();
                expect(type.label).toBeDefined();
                expect(type.Component).toBeDefined();
                expect(type.icon).toBeDefined();
            });
        });
    });
});

describe('ALL_BLOCK_TYPES', () => {
    it('should be a flattened array of all types', () => {
        const totalTypes = BLOCK_TYPE_CATEGORIES.reduce(
            (sum, cat) => sum + cat.types.length,
            0
        );
        expect(ALL_BLOCK_TYPES.length).toBe(totalTypes);
    });

    it('should have unique values', () => {
        const values = ALL_BLOCK_TYPES.map(type => type.value);
        const uniqueValues = new Set(values);
        expect(uniqueValues.size).toBe(values.length);
    });

    it('should contain leftWing type', () => {
        const leftWing = ALL_BLOCK_TYPES.find(type => type.value === 'leftWing');
        expect(leftWing).toBeDefined();
        expect(leftWing?.label).toBe('Left Wing');
    });

    it('should contain rightWing type', () => {
        const rightWing = ALL_BLOCK_TYPES.find(type => type.value === 'rightWing');
        expect(rightWing).toBeDefined();
        expect(rightWing?.label).toBe('Right Wing');
    });
});

describe('getBlockTypeInfo', () => {
    it('should return block type info for valid type', () => {
        const info = getBlockTypeInfo('leftWing');
        expect(info).toBeDefined();
        expect(info?.value).toBe('leftWing');
        expect(info?.label).toBe('Left Wing');
    });

    it('should return undefined for invalid type', () => {
        const info = getBlockTypeInfo('invalidType');
        expect(info).toBeUndefined();
    });

    it('should return correct Component for each type', () => {
        ALL_BLOCK_TYPES.forEach(type => {
            const info = getBlockTypeInfo(type.value);
            expect(info?.Component).toBe(type.Component);
        });
    });
});
