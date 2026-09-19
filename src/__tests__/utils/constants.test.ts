// Tests for constants and configuration values

import { ROLES, UI_CONFIG } from '../../utils/constants';

describe('ROLES constant', () => {
    it('should have ADMIN role defined', () => {
        expect(ROLES.ADMIN).toBeDefined();
        expect(typeof ROLES.ADMIN).toBe('number');
    });

    it('should have all expected roles', () => {
        expect(ROLES.TECHNICAL_PLANNING).toBeDefined();
        expect(ROLES.TECHNICAL_INSPECTOR).toBeDefined();
        expect(ROLES.WERKVOORBEREIDER).toBeDefined();
        expect(ROLES.HAS_PLANNING).toBeDefined();
        expect(ROLES.HAS_MONTEUR).toBeDefined();
    });

    it('should have unique role values', () => {
        const roleValues = Object.values(ROLES);
        const uniqueValues = new Set(roleValues);
        expect(uniqueValues.size).toBe(roleValues.length);
    });
});

describe('UI_CONFIG constant', () => {
    it('should have timer interval defined', () => {
        expect(UI_CONFIG.TIMER_INTERVAL).toBeDefined();
        expect(typeof UI_CONFIG.TIMER_INTERVAL).toBe('number');
        expect(UI_CONFIG.TIMER_INTERVAL).toBeGreaterThan(0);
    });

    it('should keep the timer interval short enough for a smooth elapsed-time display', () => {
        expect(UI_CONFIG.TIMER_INTERVAL).toBeLessThanOrEqual(1000);
    });
});
