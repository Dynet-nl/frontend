// Completion and appointment utilities
// Handles flat completion status and appointment checking logic

interface FileInfo {
    fileUrl?: string;
}

interface AppointmentBooked {
    date?: string;
    startTime?: string;
    endTime?: string;
    type?: string;
}

interface TechnischePlanning {
    signature?: FileInfo;
    report?: FileInfo;
    appointmentBooked?: AppointmentBooked;
}

interface HasMonteur {
    signature?: FileInfo;
    report?: FileInfo;
    appointmentBooked?: AppointmentBooked;
}

interface Flat {
    fcStatusHas?: string | number;
    technischePlanning?: TechnischePlanning;
    hasMonteur?: HasMonteur;
}

interface Building {
    flats?: Flat[];
}

interface CompletionStatus {
    percentage: number | string;
    completedFlats: number;
    totalFlats: number;
}

/**
 * Checks if a flat has signature or report files
 */
export const hasSignatureOrReport = (flat: Flat): boolean => {
    return !!(flat.technischePlanning?.signature?.fileUrl ||
        flat.technischePlanning?.report?.fileUrl ||
        flat.hasMonteur?.signature?.fileUrl ||
        flat.hasMonteur?.report?.fileUrl);
};

/**
 * Checks if a flat is completed
 */
export const isFlatCompleted = (flat: Flat): boolean => {
    // Handle both string '2' and number 2 for status comparison
    const status = flat.fcStatusHas;
    const isCompleted = status === '2' || status === 2;
    return isCompleted || hasSignatureOrReport(flat);
};

/**
 * Checks if a flat has a technical planning appointment
 */
export const hasTechnischePlanningAppointment = (flat: Flat): boolean => {
    return !!(flat.technischePlanning?.appointmentBooked?.date);
};

/**
 * Checks if a flat has a monteur appointment
 */
export const hasHasMonteurAppointment = (flat: Flat): boolean => {
    return !!(flat.hasMonteur?.appointmentBooked?.date);
};

/**
 * Checks if a flat has any type of appointment
 */
export const hasAnyAppointment = (flat: Flat): boolean => {
    return hasTechnischePlanningAppointment(flat) || hasHasMonteurAppointment(flat);
};

/**
 * Calculates overall completion status for a list of buildings
 */
export const calculateCompletionStatus = (buildings: Building[]): CompletionStatus => {
    if (!buildings || buildings.length === 0) return {
        percentage: 0,
        completedFlats: 0,
        totalFlats: 0
    };

    let totalFlats = 0;
    let completedFlats = 0;

    buildings.forEach(building => {
        if (building.flats) {
            totalFlats += building.flats.length;
            completedFlats += building.flats.filter(flat => isFlatCompleted(flat)).length;
        }
    });

    const percentage = totalFlats > 0 ? ((completedFlats / totalFlats) * 100).toFixed(2) : 0;
    return {
        percentage,
        completedFlats,
        totalFlats
    };
};

/**
 * Formats an appointment as "12 feb 09:00-11:00" (Dutch month abbreviation).
 * `date` is an ISO date, `startTime`/`endTime` are "HH:mm" strings.
 * Returns null when there is no usable date.
 */
export const formatAppointmentInline = (appointmentBooked?: AppointmentBooked): string | null => {
    if (!appointmentBooked?.date) return null;

    const start = new Date(appointmentBooked.date);
    if (isNaN(start.getTime())) return null;

    const day = start.getDate();
    const month = start.toLocaleString('nl-NL', { month: 'short' }).replace('.', '');
    let result = `${day} ${month}`;

    if (appointmentBooked.startTime) {
        result += ` ${appointmentBooked.startTime}`;
        if (appointmentBooked.endTime) {
            result += `-${appointmentBooked.endTime}`;
        }
    }

    return result;
};
