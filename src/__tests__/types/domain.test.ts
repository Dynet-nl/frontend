// Tests for the shared API-shape helpers.

import { unwrapList, flatAddress, flatLabel } from '../../types/domain';

describe('unwrapList', () => {
    it('returns a bare array as-is', () => {
        expect(unwrapList([1, 2])).toEqual([1, 2]);
    });

    it('unwraps a paginated envelope', () => {
        expect(unwrapList({ data: ['a'], pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false } })).toEqual(['a']);
    });

    it('returns an empty list for null/undefined/garbage', () => {
        expect(unwrapList(null)).toEqual([]);
        expect(unwrapList(undefined)).toEqual([]);
        expect(unwrapList({} as never)).toEqual([]);
    });
});

describe('flatAddress', () => {
    it('joins street, number and addition without "undefined"', () => {
        expect(flatAddress({ adres: 'Teststraat', huisNummer: '12', toevoeging: 'A' })).toBe('Teststraat 12A');
        expect(flatAddress({ adres: 'Teststraat', huisNummer: '12' })).toBe('Teststraat 12');
        expect(flatAddress({})).toBe('');
    });
});

describe('flatLabel', () => {
    it('does not repeat the house number when the address already ends with it', () => {
        expect(flatLabel({ adres: 'Lindenlaan 10', huisNummer: '10', toevoeging: 'H' })).toBe('Lindenlaan 10 – H');
        expect(flatLabel({ adres: 'Kastanjestraat', huisNummer: '14', toevoeging: '3' })).toBe('Kastanjestraat 14 – 3');
        expect(flatLabel({ adres: 'Rijnkade 12', huisNummer: '1' })).toBe('Rijnkade 12 1');
        expect(flatLabel({ adres: 'Zuidas 1001', huisNummer: '1001', toevoeging: 'A' })).toBe('Zuidas 1001 – A');
        expect(flatLabel({ huisNummer: '7' })).toBe('7');
        expect(flatLabel({})).toBe('');
    });
});
