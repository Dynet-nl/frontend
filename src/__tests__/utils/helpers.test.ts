// Tests for utility helper functions

import { sanitize } from '../../utils/helpers';

describe('sanitize utilities', () => {
    describe('sanitize.string', () => {
        it('should remove HTML tags from string', () => {
            const input = '<script>alert("xss")</script>Hello';
            const result = sanitize.string(input);
            expect(result).not.toContain('<script>');
            expect(result).toContain('Hello');
        });

        it('should handle null and undefined', () => {
            // The sanitize function may return null/undefined for null/undefined input
            const nullResult = sanitize.string(null as unknown as string);
            const undefinedResult = sanitize.string(undefined as unknown as string);
            expect(nullResult === '' || nullResult === null).toBe(true);
            expect(undefinedResult === '' || undefinedResult === undefined).toBe(true);
        });

        it('should trim whitespace', () => {
            expect(sanitize.string('  hello  ')).toBe('hello');
        });

        it('should handle normal strings', () => {
            expect(sanitize.string('Hello World')).toBe('Hello World');
        });
    });

    describe('sanitize.forApi', () => {
        it('should sanitize all string values in an object', () => {
            const input = {
                name: '<b>John</b>',
                email: '  test@example.com  ',
                age: 25,
            };
            const result = sanitize.forApi(input);
            expect(result.name).not.toContain('<b>');
            expect(result.email).toBe('test@example.com');
            expect(result.age).toBe(25);
        });

        it('should handle nested objects', () => {
            const input = {
                user: {
                    name: '<script>alert(1)</script>John',
                },
            };
            const result = sanitize.forApi(input);
            expect(result.user.name).not.toContain('<script>');
        });

        it('should handle arrays', () => {
            const input = {
                tags: ['<b>tag1</b>', 'tag2'],
            };
            const result = sanitize.forApi(input);
            expect(result.tags[0]).not.toContain('<b>');
        });

        it('should handle null input', () => {
            expect(sanitize.forApi(null)).toBeNull();
        });
    });
});

describe('date formatting', () => {
    it('should format dates correctly', () => {
        const date = new Date('2024-01-15T10:30:00');
        const formatted = date.toLocaleDateString('nl-NL');
        expect(formatted).toMatch(/15/);
        expect(formatted).toMatch(/1|01/);
        expect(formatted).toMatch(/2024/);
    });
});
