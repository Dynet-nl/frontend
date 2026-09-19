// Derived, display-ready facts about a building and its flats. Used by the district
// table/cards, the scheduler and the home lists so they all agree.

import type { Building, Flat, AppointmentBooked } from '../types/domain';
import { flatAddress, flatLabel } from '../types/domain';
import { categorizeBuilding, generateHBNumber } from './buildingCategorization';
import { isFlatCompleted, hasAnyAppointment } from './completionUtils';
import { floorLabel } from './format';

export interface NextAppointment {
    kind: 'technical' | 'has';
    appointment: AppointmentBooked;
    person?: string;
    flat: Flat;
}

export interface BuildingSummary {
    building: Building;
    flats: Flat[];
    /** Flats sorted top floor first (matches how installers walk a building). */
    flatsTopFirst: Flat[];
    total: number;
    completed: number;
    inProgress: number;
    scheduled: number;
    withoutAppointment: number;
    typeLabel: string;
    floors: number;
    hbNumber: string;
    complexName: string;
    next: NextAppointment | null;
    /** fcStatusHas per flat, ground floor first, for the floor stack thumbnail. */
    stack: Array<string | number | undefined>;
}

const floorIndex = (flat: Flat): number => {
    const t = (flat.toevoeging || '').trim().toUpperCase();
    if (!t || ['H', 'BG', 'GF', 'G', '00'].includes(t)) return 0;
    const n = parseInt(t, 10);
    if (!Number.isNaN(n)) return n >= 100 ? Math.floor(n / 100) : n >= 10 ? Math.floor(n / 10) : n;
    if (/^[A-Z]$/.test(t)) return 0;
    return 0;
};

export const flatFloorLabel = (flat: Flat): string => floorLabel(flat.toevoeging);

export const flatDisplayName = (flat: Flat): string => flatLabel(flat) || flatAddress(flat) || flat._id;

const upcoming = (flats: Flat[]): NextAppointment | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let best: NextAppointment | null = null;
    const consider = (candidate: NextAppointment) => {
        const d = new Date(candidate.appointment.date || '');
        if (Number.isNaN(d.getTime())) return;
        if (d < today) return;
        if (!best) { best = candidate; return; }
        const bd = new Date(best.appointment.date || '');
        if (d < bd || (d.getTime() === bd.getTime() && (candidate.appointment.startTime || '') < (best.appointment.startTime || ''))) best = candidate;
    };
    for (const flat of flats) {
        if (flat.technischePlanning?.appointmentBooked?.date) {
            consider({ kind: 'technical', appointment: flat.technischePlanning.appointmentBooked, person: flat.technischePlanning.technischeSchouwerName, flat });
        }
        if (flat.hasMonteur?.appointmentBooked?.date) {
            consider({ kind: 'has', appointment: flat.hasMonteur.appointmentBooked, person: flat.hasMonteur.hasMonteurName, flat });
        }
    }
    return best;
};

export const summarize = (building: Building): BuildingSummary => {
    const flats = building.flats ?? [];
    const sortedGroundFirst = [...flats].sort((a, b) => floorIndex(a) - floorIndex(b) || (a.toevoeging || '').localeCompare(b.toevoeging || ''));
    const flatsTopFirst = [...sortedGroundFirst].reverse();
    const completed = flats.filter(isFlatCompleted).length;
    const scheduled = flats.filter(hasAnyAppointment).length;
    const inProgress = flats.filter((f) => String(f.fcStatusHas) === '1' && !isFlatCompleted(f)).length;
    const cat = categorizeBuilding(flats);
    return {
        building,
        flats,
        flatsTopFirst,
        total: flats.length,
        completed,
        inProgress,
        scheduled,
        withoutAppointment: flats.length - scheduled,
        typeLabel: cat.typeString,
        floors: cat.floors,
        hbNumber: generateHBNumber(building, flats),
        complexName: flats.find((f) => f.complexNaam)?.complexNaam ?? '',
        next: upcoming(flats),
        stack: sortedGroundFirst.map((f) => (isFlatCompleted(f) ? '2' : f.fcStatusHas)),
    };
};

export type BuildingFilter = 'all' | 'laagbouw' | 'duplex' | 'hoogbouw' | 'noappointment' | 'scheduled' | 'pending' | 'done' | 'blocked' | 'file';

export const FILTERS: Array<{ key: BuildingFilter; labelKey: string; danger?: boolean }> = [
    { key: 'all', labelKey: 'common.all' },
    { key: 'laagbouw', labelKey: 'type.laagbouw' },
    { key: 'duplex', labelKey: 'type.duplex' },
    { key: 'hoogbouw', labelKey: 'type.hoogbouw' },
    { key: 'noappointment', labelKey: 'district.filter.noAppointment' },
    { key: 'scheduled', labelKey: 'district.filter.scheduled' },
    { key: 'pending', labelKey: 'district.filter.pending' },
    { key: 'done', labelKey: 'district.filter.completed' },
    { key: 'file', labelKey: 'district.filter.withFile' },
    { key: 'blocked', labelKey: 'district.filter.blocked', danger: true },
];

export const matchesFilter = (s: BuildingSummary, filter: BuildingFilter): boolean => {
    switch (filter) {
        case 'laagbouw': return s.typeLabel === 'Laag bouw';
        case 'duplex': return s.typeLabel === 'Duplex';
        case 'hoogbouw': return s.typeLabel === 'Hoog bouw';
        case 'noappointment': return s.total > 0 && s.scheduled === 0;
        case 'scheduled': return s.scheduled > 0;
        case 'pending': return s.total > 0 && s.completed < s.total;
        case 'done': return s.total > 0 && s.completed === s.total;
        case 'file': return !!(s.building.fileUrl || s.flats.some((f) => f.fileUrl));
        case 'blocked': return !!s.building.isBlocked;
        default: return true;
    }
};

export const matchesQuery = (s: BuildingSummary, query: string): boolean => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
        (s.building.address || '').toLowerCase().includes(q) ||
        (s.building.postcode || '').toLowerCase().includes(q) ||
        s.complexName.toLowerCase().includes(q) ||
        s.hbNumber.toLowerCase().includes(q) ||
        s.flats.some((f) => (f.zoeksleutel || '').toLowerCase().includes(q))
    );
};
