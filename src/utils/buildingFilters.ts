// Building filter utilities
// Handles all building filtering logic

import { categorizeBuilding } from './buildingCategorization';
import { hasAnyAppointment, isFlatCompleted } from './completionUtils';

interface Flat {
    complexNaam?: string;
    fileUrl?: string;
    fcStatusHas?: string | number;
    technischePlanning?: {
        signature?: { fileUrl?: string };
        report?: { fileUrl?: string };
        appointmentBooked?: { date?: string };
    };
    hasMonteur?: {
        signature?: { fileUrl?: string };
        report?: { fileUrl?: string };
        appointmentBooked?: { date?: string };
    };
    toevoeging?: string;
    zoeksleutel?: string;
    postcode?: string;
}

interface Building {
    address: string;
    flats?: Flat[];
    fileUrl?: string;
    isBlocked?: boolean;
}

type FilterType = 'all' | 'fileUrl' | 'laagBouw' | 'HB' | 'duplex' | 'appointment' | 'done' | 'pending' | 'noappointment' | 'blocked';

interface FilterCounts {
    all: number;
    fileUrl: number;
    laagBouw: number;
    HB: number;
    duplex: number;
    appointment: number;
    done: number;
    pending: number;
    noappointment: number;
    blocked: number;
}

/**
 * Filters buildings based on search query and filter type
 */
export const filterBuildings = (buildings: Building[], query: string, filter: FilterType | string): Building[] => {
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
 */
export const calculateFilterCounts = (buildings: Building[]): FilterCounts => {
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
