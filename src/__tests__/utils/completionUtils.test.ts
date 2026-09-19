// Tests for completion + appointment helpers used on the building cards.

import {
    isFlatCompleted,
    hasAnyAppointment,
    calculateCompletionStatus,
    formatAppointmentInline,
} from '../../utils/completionUtils';

describe('isFlatCompleted', () => {
    it('treats fcStatusHas "2" (string or number) as completed', () => {
        expect(isFlatCompleted({ fcStatusHas: '2' })).toBe(true);
        expect(isFlatCompleted({ fcStatusHas: 2 })).toBe(true);
        expect(isFlatCompleted({ fcStatusHas: '1' })).toBe(false);
        expect(isFlatCompleted({})).toBe(false);
    });

    it('treats a signed report or signature as completed', () => {
        expect(isFlatCompleted({ technischePlanning: { report: { fileUrl: '/r.pdf' } } })).toBe(true);
        expect(isFlatCompleted({ hasMonteur: { signature: { fileUrl: '/s.png' } } })).toBe(true);
    });
});

describe('hasAnyAppointment', () => {
    it('detects either appointment type', () => {
        expect(hasAnyAppointment({ technischePlanning: { appointmentBooked: { date: '2026-01-05' } } })).toBe(true);
        expect(hasAnyAppointment({ hasMonteur: { appointmentBooked: { date: '2026-01-05' } } })).toBe(true);
        expect(hasAnyAppointment({ hasMonteur: { appointmentBooked: {} } })).toBe(false);
    });
});

describe('calculateCompletionStatus', () => {
    it('sums flats across buildings', () => {
        const result = calculateCompletionStatus([
            { flats: [{ fcStatusHas: '2' }, { fcStatusHas: '0' }] },
            { flats: [{ fcStatusHas: '2' }] },
            { flats: [] },
        ]);
        expect(result).toEqual({ percentage: '66.67', completedFlats: 2, totalFlats: 3 });
    });

    it('handles an empty list', () => {
        expect(calculateCompletionStatus([])).toEqual({ percentage: 0, completedFlats: 0, totalFlats: 0 });
    });
});

describe('formatAppointmentInline', () => {
    it('formats date + HH:mm range (the times are strings, not Dates)', () => {
        expect(formatAppointmentInline({ date: '2026-02-12T00:00:00.000Z', startTime: '09:00', endTime: '11:00' })).toMatch(/^12 feb 09:00-11:00$/);
    });

    it('omits the end time when absent', () => {
        expect(formatAppointmentInline({ date: '2026-02-12T00:00:00.000Z', startTime: '09:00' })).toMatch(/^12 feb 09:00$/);
    });

    it('returns only the date when there are no times', () => {
        expect(formatAppointmentInline({ date: '2026-02-12T00:00:00.000Z' })).toMatch(/^12 feb$/);
    });

    it('returns null without a usable date', () => {
        expect(formatAppointmentInline(undefined)).toBeNull();
        expect(formatAppointmentInline({ startTime: '09:00' })).toBeNull();
        expect(formatAppointmentInline({ date: 'not-a-date', startTime: '09:00' })).toBeNull();
    });
});
