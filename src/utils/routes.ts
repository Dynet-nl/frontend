// Route helpers shared by lists, cards and dashboards.

import { ROLES } from './constants';
import { BASE_URL } from '../api/axios';

export const apartmentHref = (flatId: string): string => `/apartment/${flatId}`;

export type ScheduleType = 'Technical' | 'HAS';

/** Which schedule type a set of roles books by default. */
export const defaultScheduleType = (roles: number[] = []): ScheduleType => {
    if (roles.includes(ROLES.HAS_PLANNING) || roles.includes(ROLES.HAS_MONTEUR)) {
        if (!roles.includes(ROLES.TECHNICAL_PLANNING) && !roles.includes(ROLES.ADMIN)) return 'HAS';
    }
    if (roles.includes(ROLES.ADMIN) && !roles.includes(ROLES.TECHNICAL_PLANNING) && (roles.includes(ROLES.HAS_PLANNING) || roles.includes(ROLES.HAS_MONTEUR))) return 'HAS';
    return 'Technical';
};

export const canSchedule = (roles: number[] = []): boolean =>
    roles.some((r) => ([ROLES.ADMIN, ROLES.TECHNICAL_PLANNING, ROLES.HAS_PLANNING, ROLES.WERKVOORBEREIDER, ROLES.TECHNICAL_INSPECTOR, ROLES.HAS_MONTEUR] as number[]).includes(r));

export const canScheduleTechnical = (roles: number[] = []): boolean =>
    roles.some((r) => ([ROLES.ADMIN, ROLES.TECHNICAL_PLANNING, ROLES.WERKVOORBEREIDER, ROLES.TECHNICAL_INSPECTOR] as number[]).includes(r));

export const canScheduleHas = (roles: number[] = []): boolean =>
    roles.some((r) => ([ROLES.ADMIN, ROLES.HAS_PLANNING, ROLES.HAS_MONTEUR] as number[]).includes(r));

export const scheduleBuildingHref = (buildingId: string, roles: number[] = [], type?: ScheduleType): string =>
    `/schedule/${buildingId}?mode=building&type=${type ?? defaultScheduleType(roles)}`;

export const scheduleFlatHref = (flatId: string, type: ScheduleType): string =>
    `/schedule/${flatId}?mode=single&type=${type}`;

/** Absolute URL for an uploaded file path ("/uploads/x.jpg") served by the API. */
export const uploadUrl = (path?: string | null): string | undefined => {
    if (!path) return undefined;
    if (/^https?:\/\//.test(path)) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
