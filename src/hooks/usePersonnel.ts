// Users with a given role (schouwers, monteurs) for pickers and calendar legends.
// Every role may list users; only Admin gets e-mail addresses back.

import { useMemo } from 'react';
import { useApi } from './useApi';
import { unwrapList, PaginatedResponse } from '../types/domain';

export interface Personnel {
    _id: string;
    name?: string;
    email?: string;
    color?: string;
    roles?: Record<string, number>;
}

export type PersonnelRole = 'TechnischeSchouwer' | 'HASMonteur' | 'HASPlanning' | 'TechnischePlanning' | 'Werkvoorbereider' | 'Admin';

export const usePersonnel = (role?: PersonnelRole) => {
    const { data, loading, error, reload } = useApi<PaginatedResponse<Personnel> | Personnel[]>('/api/users', { params: { limit: 500 } });
    const people = useMemo(() => {
        const all = unwrapList<Personnel>(data ?? undefined);
        const filtered = role ? all.filter((u) => u.roles && typeof u.roles === 'object' && u.roles[role] !== undefined && u.roles[role] !== null) : all;
        return filtered.filter((u) => u.name).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [data, role]);
    const colorOf = useMemo(() => {
        const map = new Map<string, string>();
        unwrapList<Personnel>(data ?? undefined).forEach((u) => { if (u.name && u.color) map.set(u.name, u.color); });
        return (name?: string) => (name ? map.get(name) : undefined);
    }, [data]);
    return { people, colorOf, loading, error, reload };
};
