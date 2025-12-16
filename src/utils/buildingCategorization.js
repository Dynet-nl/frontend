// Building categorization utilities
// Handles building type classification based on Dutch building standards and flat count analysis

/**
 * Extracts floor number from flat identifier - tries multiple sources
 * @param {Object} flat - Flat object with toevoeging and zoeksleutel
 * @returns {number} - Floor number (0 for ground floor, -1 if unable to determine)
 */
const extractFloorFromFlat = (flat) => {
    // Null safety check
    if (!flat || typeof flat !== 'object') return -1;
    
    // First try toevoeging field
    let identifier = flat.toevoeging;
    if (identifier && typeof identifier === 'string' && identifier.trim()) {
        const result = extractFloorFromIdentifier(identifier);
        if (result >= 0) return result;
    }
    
    // If toevoeging is empty/null, try to extract from zoeksleutel (opdrachtnummer pattern)
    identifier = flat.zoeksleutel;
    if (identifier && typeof identifier === 'string') {
        // Pattern: POSTCODE_HOUSENUMBER_FLATNUMBER_ (e.g., "1075TB_23_1_" or "1075TB_23_301_")
        const parts = identifier.split('_').filter(part => part !== ''); // Remove empty parts
        if (parts.length >= 3) {
            const flatNumber = parts[parts.length - 1]; // Last non-empty part is flat identifier
            const result = extractFloorFromIdentifier(flatNumber);
            if (result >= 0) return result;
        }
        
        // Alternative pattern: try extracting numeric part before trailing underscore
        const beforeTrailingUnderscore = identifier.match(/_(\d+)_?$/);
        if (beforeTrailingUnderscore) {
            const result = extractFloorFromIdentifier(beforeTrailingUnderscore[1]);
            if (result >= 0) return result;
        }
    }
    
    return -1; // Unable to determine
};

/**
 * Extracts floor number from flat identifier string (Dutch system)
 * @param {string} identifier - Flat identifier (e.g., "1", "2", "3", "H")
 * @returns {number} - Floor number (0 for ground floor, -1 if unable to determine)
 */
const extractFloorFromIdentifier = (identifier) => {
    if (!identifier || typeof identifier !== 'string') return -1;
    
    const cleanIdentifier = identifier.trim().toUpperCase();
    
    // Dutch ground floor indicators: H (Hoofdverdieping), BG (Begane Grond), etc.
    if (['H', 'BG', 'GF', '00', 'G', 'BEGANE GROND', 'HOOFDVERDIEPING'].includes(cleanIdentifier)) return 0;
    
    // Dutch numbering: Single digits 1,2,3,4,5... are floor numbers (not horizontal units!)
    const singleDigit = cleanIdentifier.match(/^(\d)$/);
    if (singleDigit) {
        const floorNumber = parseInt(singleDigit[1], 10);
        if (floorNumber >= 1 && floorNumber <= 9) {
            return floorNumber; // 1=first floor, 2=second floor, etc.
        }
        if (floorNumber === 0) return 0; // Ground floor
    }
    
    // For 2-digit numbers like 01, 02, 11, 12, 21, 22
    const numericPart = cleanIdentifier.match(/^(\d+)/);
    if (numericPart) {
        const number = parseInt(numericPart[1], 10);
        
        // For 3-digit numbers like 301, 201 - first digit is the floor number
        if (number >= 100) {
            return Math.floor(number / 100);
        }
        
        // For 2-digit numbers like 11, 12, 21, 22 - first digit is floor
        if (number >= 10) {
            const floorDigit = Math.floor(number / 10);
            return floorDigit; // 0=ground, 1=first, 2=second, etc.
        }
    }
    
    // Letter-based single letters (A, B, C, etc.) could be ground floor units
    if (cleanIdentifier.match(/^[A-Z]$/) && cleanIdentifier !== 'H') {
        return 0; // Ground floor
    }
    
    // Mixed patterns like "1A", "2B" - first digit is floor
    const mixedPattern = cleanIdentifier.match(/^(\d+)[A-Z]$/);
    if (mixedPattern) {
        return parseInt(mixedPattern[1], 10);
    }
    
    return -1; // Unable to determine
};

/**
 * Calculates the number of floors in a building based on flat identifiers
 * @param {Array} flats - Array of flat objects
 * @returns {number} - Number of floors
 */
const calculateBuildingFloors = (flats) => {
    if (!flats || flats.length === 0) return 0;
    
    const floors = new Set();
    let hasIdentifiableFloors = false;
    
    flats.forEach(flat => {
        const floorNumber = extractFloorFromFlat(flat);
        if (floorNumber >= 0) {
            floors.add(floorNumber);
            hasIdentifiableFloors = true;
        }
    });
    
    // If we can identify floors from toevoeging, use that count
    if (hasIdentifiableFloors && floors.size > 0) {
        return floors.size;
    }
    
    // Fallback: estimate floors based on flat count and patterns
    const totalFlats = flats.length;
    if (totalFlats === 1) return 1;
    
    if (totalFlats === 2) {
        // Check if it's likely horizontal (same floor) or vertical (duplex)
        const indicators = flats.map(f => f.toevoeging?.trim()).filter(Boolean);
        
        // Clear horizontal patterns (A/B, L/R, etc.)
        const hasHorizontalPattern = indicators.length === 2 && 
            indicators.every(t => ['A', 'B', 'L', 'R', 'LINKS', 'RECHTS'].includes(t?.toUpperCase()));
        
        // Sequential single digits (1, 2 or similar) are likely horizontal
        const isSequentialSingleDigit = indicators.length === 2 &&
            indicators.every(t => /^\d$/.test(t)) &&
            Math.abs(parseInt(indicators[0]) - parseInt(indicators[1])) === 1;
            
        return (hasHorizontalPattern || isSequentialSingleDigit) ? 1 : 2;
    }
    
    // For 3-4 flats, likely still low-rise (1-2 floors)  
    if (totalFlats <= 4) return Math.min(2, Math.ceil(totalFlats / 2));
    
    // For larger buildings, estimate floors (assuming average 2-3 flats per floor)
    return Math.ceil(totalFlats / 2.5);
};

/**
 * Categorizes a building based on floor count (NEW IMPLEMENTATION)
 * Uses your requirements: Laag bouw = 1 floor, Duplex = 2 floors, Hoog bouw = 3+ floors
 * @param {Array} flats - Array of flat objects
 * @returns {Object} - {types, typeString, floors}
 */
export const categorizeBuilding = (flats) => {
    if (!flats || flats.length === 0) return {types: [], typeString: '', floors: 0};
    
    const floors = calculateBuildingFloors(flats);
    let buildingType;
    

    
    if (floors === 1) {
        buildingType = 'Laag bouw';
    } else if (floors === 2) {
        buildingType = 'Duplex';
    } else {
        buildingType = 'Hoog bouw'; // 3 floors and above
    }
    
    return {
        types: [{type: buildingType, prefix: buildingType}],
        typeString: buildingType,
        floors: floors
    };
};

/**
 * Generates HB-number for high buildings
 * @param {Object} building - Building object
 * @param {Array} flats - Array of flat objects
 * @returns {string} - HB-number or empty string
 */
export const generateHBNumber = (building, flats) => {
    if (!flats || flats.length === 0) return '';
    
    const totalFlats = flats.length;
    const {typeString} = categorizeBuilding(flats);
    
    if (typeString !== 'Hoog bouw') return '';
    
    // Find a flat with a valid postcode (don't rely on array order)
    const flatWithPostcode = flats.find(f => f?.postcode && f.postcode.trim());
    const postcode = flatWithPostcode?.postcode || '';
    const postcodeNumbers = postcode.replace(/[^0-9]/g, '').slice(0, 4);
    
    const address = building?.address || '';
    const addressNumbers = address.replace(/[^0-9]/g, '');
    const firstAddressNumber = addressNumbers.slice(0, 3) || '001';
    
    const hbNumber = `HB-${postcodeNumbers}${totalFlats.toString().padStart(2, '0')}${firstAddressNumber.padStart(3, '0')}`;
    
    return hbNumber;
};
