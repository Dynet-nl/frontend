// Shared domain types for API payloads. Pages and components import these instead of
// re-declaring their own `Building` / `Flat` shapes (which TypeScript treats as unrelated
// types and which drifted apart over time).

export interface AppointmentBooked {
    date?: string;
    startTime?: string;
    endTime?: string;
    weekNumber?: number;
    type?: string;
    complaintDetails?: string;
}

export interface FileInfo {
    fileUrl?: string;
}

export interface TechnischePlanning {
    _id?: string;
    appointmentBooked?: AppointmentBooked;
    technischeSchouwerName?: string;
    telephone?: string;
    additionalNotes?: string;
    signature?: FileInfo;
    report?: FileInfo;
}

export interface HasMonteur {
    _id?: string;
    appointmentBooked?: AppointmentBooked;
    hasMonteurName?: string;
    installation?: { status?: string; startTime?: string; endTime?: string };
    signature?: FileInfo;
    report?: FileInfo;
}

export interface Flat {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    zoeksleutel?: string;
    postcode?: string;
    complexNaam?: string;
    fileUrl?: string;
    fcStatusHas?: string | number;
    technischePlanning?: TechnischePlanning;
    hasMonteur?: HasMonteur;
}

export interface Building {
    _id: string;
    address: string;
    postcode?: string;
    district?: string;
    flats?: Flat[];
    fileUrl?: string;
    isBlocked?: boolean;
    blockReason?: string;
}

export interface District {
    _id: string;
    name: string;
    priority?: number;
    area?: { _id: string; name: string } | string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

/** Accepts either a paginated `{ data: [...] }` envelope or a bare array. */
export const unwrapList = <T>(payload: PaginatedResponse<T> | T[] | null | undefined): T[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
};

/** Full address line for a flat: "Straat 12A" */
export const flatAddress = (flat: Pick<Flat, 'adres' | 'huisNummer' | 'toevoeging'>): string =>
    `${flat.adres ?? ''} ${flat.huisNummer ?? ''}${flat.toevoeging ?? ''}`.trim();
