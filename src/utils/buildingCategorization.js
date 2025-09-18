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
    
    const buildingTypes = flats.map(flat => flat.soortBouw).filter(type => type);
    const uniqueBuildingTypes = [...new Set(buildingTypes)];
    
    if (uniqueBuildingTypes.length === 1) {
        const singleType = uniqueBuildingTypes[0];
        let standardizedType;
        if (singleType.toLowerCase().includes('hoog')) {
            standardizedType = 'Hoog bouw';
        } else if (singleType.toLowerCase().includes('laag')) {
            standardizedType = 'Laag bouw';
        } else if (singleType.toLowerCase().includes('duplex')) {
            standardizedType = 'Duplex';
        } else {
standardizedType = singleType;
        }
        
        return {
            types: [{type: standardizedType, prefix: standardizedType}],
            typeString: standardizedType
        };
    }
    
    const totalFlats = flats.length;
    let buildingType;
    
    if (totalFlats === 1) {
buildingType = 'Laag bouw';
    } else if (totalFlats === 2) {
        const floorIndicators = flats.map(flat => flat.toevoeging).filter(t => t && t.trim() !== '');
        const uniqueIndicators = [...new Set(floorIndicators)];
        
        const hasHorizontalPattern = uniqueIndicators.length === 2 && 
            (uniqueIndicators.every(t => ['A', 'B', 'L', 'R', 'Links', 'Rechts'].includes(t)) ||
uniqueIndicators.every(t => t.match(/^[A-Z]$/))
            );
        
        buildingType = hasHorizontalPattern ? 'Laag bouw' : 'Duplex';
    } else if (totalFlats === 3 || totalFlats === 4) {
        buildingType = 'Laag bouw';
    } else if (totalFlats <= 10) {
const estimatedFloors = Math.ceil(totalFlats / 2.5);
        buildingType = estimatedFloors >= 5 ? 'Hoog bouw' : 'Laag bouw';
    } else {
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
    
    if (typeString !== 'Hoog bouw') return '';
    
    const postcode = flats[0]?.postcode || '';
    const postcodeNumbers = postcode.replace(/[^0-9]/g, '').slice(0, 4);
    
    const address = building.address || '';
    const addressNumbers = address.replace(/[^0-9]/g, '');
    const firstAddressNumber = addressNumbers.slice(0, 3) || '001';
    
    const hbNumber = `HB-${postcodeNumbers}${totalFlats.toString().padStart(2, '0')}${firstAddressNumber.padStart(3, '0')}`;
    
    return hbNumber;
};
