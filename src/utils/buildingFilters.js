// Building filter utilities
// Handles all building filtering logic

import { categorizeBuilding } from './buildingCategorization.js';
import { hasAnyAppointment, isFlatCompleted } from './completionUtils.js';

/**
 * Filters buildings based on search query and filter type
 * @param {Array} buildings - Array of building objects
 * @param {string} query - Search query
 * @param {string} filter - Filter type
 * @returns {Array} - Filtered buildings
 */
export const filterBuildings = (buildings, query, filter) => {
    let filteredBuildings = buildings;
    if (!buildings) return [];

    if (query) {
        filteredBuildings = buildings.filter((building) =>
            building.address.toLowerCase().includes(query) ||
            (building.flats && building.flats.some((flat) =>
                flat.complexNaam && flat.complexNaam.toLowerCase().includes(query)
            ))
        );
    }

    switch (filter) {
        case 'fileUrl':
            return filteredBuildings.filter(building => 
                building.fileUrl || 
                (building.flats && building.flats.some(flat => flat.fileUrl))
            );
        case 'laagBouw':
            return filteredBuildings.filter(building => {
                if (!building.flats || building.flats.length === 0) return false;
                const {typeString} = categorizeBuilding(building.flats);
                return typeString === 'Laag bouw'; // Exact match for 1 floor buildings
            });
        case 'HB':
            return filteredBuildings.filter(building => {
                if (!building.flats || building.flats.length === 0) return false;
                const {typeString} = categorizeBuilding(building.flats);
                return typeString === 'Hoog bouw'; // Exact match for 3+ floor buildings
            });
        case 'duplex':
            return filteredBuildings.filter(building => {
                if (!building.flats || building.flats.length === 0) return false;
                const {typeString} = categorizeBuilding(building.flats);
                return typeString === 'Duplex'; // Exact match for 2 floor buildings
            });
        case 'appointment':
            return filteredBuildings.filter(building =>
                building.flats && building.flats.some(flat => hasAnyAppointment(flat))
            );
        case 'done':
            const doneBuildings = filteredBuildings.filter(building => {
                const isFullyCompleted = building.flats && building.flats.length > 0 && building.flats.every(flat => isFlatCompleted(flat));
                return isFullyCompleted;
            });
            return doneBuildings;
        case 'pending':
            return filteredBuildings.filter(building =>
                building.flats && building.flats.some(flat => !isFlatCompleted(flat))
            );
        case 'noappointment':
            return filteredBuildings.filter(building =>
                building.flats && building.flats.every(flat => !hasAnyAppointment(flat))
            );
        case 'blocked':
            return filteredBuildings.filter(building => building.isBlocked === true);
        case 'all':
        default:
            return filteredBuildings;
    }
};

/**
 * Calculates filter counts for all filter types
 * @param {Array} buildings - Array of building objects
 * @returns {Object} - Object with counts for each filter type
 */
export const calculateFilterCounts = (buildings) => {
    if (!buildings || buildings.length === 0) {
        return {
            all: 0,
            fileUrl: 0,
            laagBouw: 0,
            HB: 0,
            duplex: 0,
            appointment: 0,
            done: 0,
            pending: 0,
            noappointment: 0,
            blocked: 0
        };
    }

    return {
        all: buildings.length,
        fileUrl: filterBuildings(buildings, '', 'fileUrl').length,
        laagBouw: filterBuildings(buildings, '', 'laagBouw').length,
        HB: filterBuildings(buildings, '', 'HB').length,
        duplex: filterBuildings(buildings, '', 'duplex').length,
        appointment: filterBuildings(buildings, '', 'appointment').length,
        done: filterBuildings(buildings, '', 'done').length,
        pending: filterBuildings(buildings, '', 'pending').length,
        noappointment: filterBuildings(buildings, '', 'noappointment').length,
        blocked: filterBuildings(buildings, '', 'blocked').length
    };
};
