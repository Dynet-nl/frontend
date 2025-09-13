// Building categorization utilities
// Handles building type classification based on Dutch building standards and flat count analysis

/**
 * Categorizes a building based on its flats
 * Uses official Dutch Bouwbesluit standards where possible
 * @param {Array} flats - Array of flat objects
 * @returns {Object} - {types, typeString}
 */
export const categorizeBuilding = (flats) => {
    if (!flats || flats.length === 0) return {types: [], typeString: ''};
    
    // Check actual soortBouw data from flats, but only use if consistent
    const buildingTypes = flats.map(flat => flat.soortBouw).filter(type => type);
    const uniqueBuildingTypes = [...new Set(buildingTypes)];
    
    // Only use actual building type data if it's consistent (single type) and standardized
    if (uniqueBuildingTypes.length === 1) {
        const singleType = uniqueBuildingTypes[0];
        // Standardize the naming to match our Dutch standards
        let standardizedType;
        if (singleType.toLowerCase().includes('hoog')) {
            standardizedType = 'Hoog bouw';
        } else if (singleType.toLowerCase().includes('laag')) {
            standardizedType = 'Laag bouw';
        } else if (singleType.toLowerCase().includes('duplex')) {
            standardizedType = 'Duplex';
        } else {
            standardizedType = singleType; // Keep original if it doesn't match common patterns
        }
        
        return {
            types: [{type: standardizedType, prefix: standardizedType}],
            typeString: standardizedType
        };
    }
    
    // Fallback categorization based on Dutch building standards
    // Official Dutch Bouwbesluit: Hoogbouw = 5+ floors (elevator required), Laagbouw = 1-4 floors
    const totalFlats = flats.length;
    let buildingType;
    
    if (totalFlats === 1) {
        buildingType = 'Laag bouw'; // Single flat = definitely low building (1 floor)
    } else if (totalFlats === 2) {
        // For exactly 2 flats, default to Duplex unless there's clear evidence of horizontal layout
        const floorIndicators = flats.map(flat => flat.toevoeging).filter(t => t && t.trim() !== '');
        const uniqueIndicators = [...new Set(floorIndicators)];
        
        // Only classify as "Laag bouw" if there's clear evidence of horizontal layout
        // (same floor indicators or indicators suggesting side-by-side layout)
        const hasHorizontalPattern = uniqueIndicators.length === 2 && 
            (uniqueIndicators.every(t => ['A', 'B', 'L', 'R', 'Links', 'Rechts'].includes(t)) ||
             uniqueIndicators.every(t => t.match(/^[A-Z]$/)) // Single letters like A, B, C
            );
        
        buildingType = hasHorizontalPattern ? 'Laag bouw' : 'Duplex';
    } else if (totalFlats === 3 || totalFlats === 4) {
        // 3-4 flats: definitely NOT duplex, always Laag bouw (small apartment building)
        // These are small apartment buildings, typically 1-2 floors, always under elevator requirement
        buildingType = 'Laag bouw';
    } else if (totalFlats <= 10) {
        // 5-10 flats: likely 2-5 floors, borderline case
        const estimatedFloors = Math.ceil(totalFlats / 2.5); // Slightly more flats per floor
        buildingType = estimatedFloors >= 5 ? 'Hoog bouw' : 'Laag bouw';
    } else {
        // 11+ flats: definitely high building (5+ floors, elevator required)
        buildingType = 'Hoog bouw';
    }
    
    return {
        types: [{type: buildingType, prefix: buildingType}],
        typeString: buildingType
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
    
    // Only generate HB-number for Hoog bouw (High Building) types
    if (typeString !== 'Hoog bouw') return '';
    
    // Get postcode from first flat for area identification
    const postcode = flats[0]?.postcode || '';
    const postcodeNumbers = postcode.replace(/[^0-9]/g, '').slice(0, 4);
    
    // Get address for unique identification
    const address = building.address || '';
    const addressNumbers = address.replace(/[^0-9]/g, '');
    const firstAddressNumber = addressNumbers.slice(0, 3) || '001';
    
    // Generate HB-number format: HB-[postcode][flatcount][addressnumber]
    // Example: HB-107150025 (postcode 1071, 50 flats, address 25)
    const hbNumber = `HB-${postcodeNumbers}${totalFlats.toString().padStart(2, '0')}${firstAddressNumber.padStart(3, '0')}`;
    
    return hbNumber;
};
