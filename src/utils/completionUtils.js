// Completion and appointment utilities
// Handles flat completion status and appointment checking logic

/**
 * Checks if a flat has signature or report files
 * @param {Object} flat - Flat object
 * @returns {boolean}
 */
export const hasSignatureOrReport = (flat) => {
    return !!(flat.technischePlanning?.signature?.fileUrl ||
        flat.technischePlanning?.report?.fileUrl ||
        flat.hasMonteur?.signature?.fileUrl ||
        flat.hasMonteur?.report?.fileUrl);
};

/**
 * Checks if a flat is completed
 * @param {Object} flat - Flat object
 * @returns {boolean}
 */
export const isFlatCompleted = (flat) => {
    return flat.fcStatusHas === '2' || hasSignatureOrReport(flat);
};

/**
 * Checks if a flat has a technical planning appointment
 * @param {Object} flat - Flat object
 * @returns {boolean}
 */
export const hasTechnischePlanningAppointment = (flat) => {
    return !!(flat.technischePlanning?.appointmentBooked?.date);
};

/**
 * Checks if a flat has a monteur appointment
 * @param {Object} flat - Flat object
 * @returns {boolean}
 */
export const hasHasMonteurAppointment = (flat) => {
    return !!(flat.hasMonteur?.appointmentBooked?.date);
};

/**
 * Checks if a flat has any type of appointment
 * @param {Object} flat - Flat object
 * @returns {boolean}
 */
export const hasAnyAppointment = (flat) => {
    return hasTechnischePlanningAppointment(flat) || hasHasMonteurAppointment(flat);
};

/**
 * Calculates overall completion status for a list of buildings
 * @param {Array} buildings - Array of building objects
 * @returns {Object} - {percentage, completedFlats, totalFlats}
 */
export const calculateCompletionStatus = (buildings) => {
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
