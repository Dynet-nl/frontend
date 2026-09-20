// Dates, week numbers and small formatters. Dutch conventions everywhere:
// "21 sep 2026", "ma 21 sep", 24-hour times, ISO week numbers.

const MONTHS_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const DAYS_SHORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const DAYS_LONG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

export const toDate = (value: string | Date | undefined | null): Date | null => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

/** ISO 8601 week number (Monday-based). */
export const isoWeek = (value: string | Date): number => {
    const d = toDate(value);
    if (!d) return 0;
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

/** "21 sep" */
export const fmtDayMonth = (value: string | Date | undefined | null): string => {
    const d = toDate(value);
    return d ? `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}` : '';
};

/** "21 sep 2026" */
export const fmtDate = (value: string | Date | undefined | null): string => {
    const d = toDate(value);
    return d ? `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}` : '';
};

/** "ma 21 sep" */
export const fmtWeekday = (value: string | Date | undefined | null): string => {
    const d = toDate(value);
    return d ? `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}` : '';
};

/** "maandag 21 september 2026" */
export const fmtLong = (value: string | Date | undefined | null): string => {
    const d = toDate(value);
    if (!d) return '';
    return `${DAYS_LONG[d.getDay()]} ${d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`;
};

/** "21 sep 2026 · 21:59" */
export const fmtDateTime = (value: string | Date | undefined | null): string => {
    const d = toDate(value);
    if (!d) return '';
    return `${fmtDate(d)} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** "08:00–09:30" */
export const fmtRange = (start?: string, end?: string): string => {
    if (!start) return '';
    return end ? `${start}–${end}` : start;
};

/** "21 sep · 08:00–09:30" */
export const fmtAppointment = (date?: string | Date | null, start?: string, end?: string): string => {
    const day = fmtDayMonth(date);
    const range = fmtRange(start, end);
    return [day, range].filter(Boolean).join(' · ');
};

/** yyyy-mm-dd in local time, for <input type="date"> */
export const toInputDate = (value: string | Date | undefined | null): string => {
    const d = toDate(value);
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const todayInputDate = (): string => toInputDate(new Date());

export const isSameDay = (a: string | Date, b: string | Date): boolean => toInputDate(a) === toInputDate(b);

/** 30,6% */
export const fmtPercent = (value: number, decimals = 1): string =>
    `${value.toFixed(decimals).replace('.', ',')}%`;

/** "2 dagen", "1 dag" */
export const daysAgo = (value: string | Date | undefined | null): string => {
    const d = toDate(value);
    if (!d) return '';
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return 'vandaag';
    return `${days} ${days === 1 ? 'dag' : 'dagen'}`;
};

/** "06 10087109" */
export const fmtPhone = (value?: string | null): string => {
    if (!value) return '';
    const digits = value.replace(/\s+/g, '');
    if (/^06\d{8}$/.test(digits)) return `06 ${digits.slice(2)}`;
    if (/^\+316\d{8}$/.test(digits)) return `06 ${digits.slice(4)}`;
    return value;
};

export const telHref = (value?: string | null): string | undefined => {
    if (!value) return undefined;
    return `tel:${value.replace(/[^\d+]/g, '')}`;
};

export const mapsHref = (address?: string, postcode?: string): string =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([address, postcode].filter(Boolean).join(', '))}`;

/** "1 flat" / "3 flats" */
export const plural = (n: number, singular: string, pluralForm: string = `${singular}s`): string =>
    `${n} ${n === 1 ? singular : pluralForm}`;

export const initials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const greeting = (): 'home.greeting.morning' | 'home.greeting.afternoon' | 'home.greeting.evening' => {
    const h = new Date().getHours();
    if (h < 12) return 'home.greeting.morning';
    if (h < 18) return 'home.greeting.afternoon';
    return 'home.greeting.evening';
};

/** Floor label from the toevoeging (H/BG = ground floor, digits = floor). */
export const floorLabel = (toevoeging?: string): string => {
    const t = (toevoeging || '').trim().toUpperCase();
    if (!t || ['H', 'BG', 'GF', 'G', '0', '00'].includes(t)) return 'Begane grond';
    const n = parseInt(t, 10);
    if (!Number.isNaN(n)) return `${n}e verdieping`;
    return '';
};
