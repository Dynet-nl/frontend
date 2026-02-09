// Tests for building types and constants

import { FLOOR_OPTIONS, INITIAL_BLOCK } from '../../types/building';

describe('FLOOR_OPTIONS', () => {
    it('should have a default empty option', () => {
        const emptyOption = FLOOR_OPTIONS.find(opt => opt.value === '');
        expect(emptyOption).toBeDefined();
        expect(emptyOption?.label).toBe('Select floor');
    });

    it('should have floor options from BG (0) to 5', () => {
        const floorValues = FLOOR_OPTIONS.map(opt => opt.value).filter(v => v !== '');
        expect(floorValues).toContain(0); // BG
        expect(floorValues).toContain(1);
        expect(floorValues).toContain(2);
        expect(floorValues).toContain(3);
        expect(floorValues).toContain(4);
        expect(floorValues).toContain(5);
    });

    it('should have BG as label for floor 0', () => {
        const bgOption = FLOOR_OPTIONS.find(opt => opt.value === 0);
        expect(bgOption?.label).toBe('BG');
    });
});

describe('INITIAL_BLOCK', () => {
    it('should have default firstFloor of 0', () => {
        expect(INITIAL_BLOCK.firstFloor).toBe(0);
    });

    it('should have empty topFloor', () => {
        expect(INITIAL_BLOCK.topFloor).toBe('');
    });

    it('should have empty blockType', () => {
        expect(INITIAL_BLOCK.blockType).toBe('');
    });

    it('should have empty floors array', () => {
        expect(INITIAL_BLOCK.floors).toEqual([]);
    });

    it('should be a valid BlockConfig shape', () => {
        expect(INITIAL_BLOCK).toHaveProperty('firstFloor');
        expect(INITIAL_BLOCK).toHaveProperty('topFloor');
        expect(INITIAL_BLOCK).toHaveProperty('blockType');
        expect(INITIAL_BLOCK).toHaveProperty('floors');
    });
});
