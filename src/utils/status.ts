// One status vocabulary: seven families, each with a colour class, a glyph and a label.

import { t } from '../i18n';

export type StatusFamily = 'none' | 'progress' | 'done' | 'planned' | 'blocked' | 'fault' | 'complaint';

export interface StatusSpec {
    family: StatusFamily;
    icon: string;
    label: string;
}

/** Operator delivery status (fcStatusHas 0/1/2). */
export const deliveryStatus = (code?: string | number | null): StatusSpec => {
    switch (String(code ?? '')) {
        case '2': return { family: 'done', icon: 'check_circle', label: t('status.completed') };
        case '1': return { family: 'progress', icon: 'pending', label: t('status.inProgress') };
        case '0': return { family: 'none', icon: 'radio_button_unchecked', label: t('status.notStarted') };
        default: return { family: 'none', icon: 'radio_button_unchecked', label: t('status.unknown') };
    }
};

/** HAS appointment type. */
export const hasTypeStatus = (type?: string | null): StatusSpec => {
    switch (type) {
        case 'Storing': return { family: 'fault', icon: 'bolt', label: t('agenda.type.Storing') };
        case 'Complaint': return { family: 'complaint', icon: 'flag', label: t('agenda.type.Complaint') };
        default: return { family: 'planned', icon: 'construction', label: t('agenda.type.HAS') };
    }
};

/** Installation status from the installer's completion. */
export const installationStatus = (status?: string | null): StatusSpec => {
    switch (status) {
        case 'completed': return { family: 'done', icon: 'check_circle', label: t('status.completed') };
        case 'in-progress': return { family: 'progress', icon: 'pending', label: t('status.inProgress') };
        case 'issues': return { family: 'blocked', icon: 'error', label: t('status.issues') };
        default: return { family: 'none', icon: 'radio_button_unchecked', label: t('status.pending') };
    }
};

export const plannedStatus = (): StatusSpec => ({ family: 'planned', icon: 'event_available', label: t('status.scheduled') });
export const blockedStatus = (): StatusSpec => ({ family: 'blocked', icon: 'block', label: t('status.blocked') });

/** Eight curated person colours (user.color). */
export const PERSON_COLORS = ['#1A6597', '#167A4B', '#6A4AA8', '#A63220', '#8A5A06', '#2E7D7A', '#7A4A8A', '#4A5A6B'];

/** Map any hex to the nearest curated colour for consistent rendering; keep custom ones as-is. */
export const personColor = (color?: string | null, fallbackIndex = 7): string => {
    if (color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return color;
    return PERSON_COLORS[fallbackIndex % PERSON_COLORS.length];
};
