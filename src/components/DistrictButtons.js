// Component displaying district navigation with modern UI, drag & drop reordering, and clear visual feedback.

import React from 'react';
import {Draggable} from 'react-beautiful-dnd';
import '../styles/districtButtons.css';

const DistrictButtons = ({districts = [], getBuildings, setCurrentDistrict, currentDistrict, buildings = []}) => {
    // Simplified logging
    console.log(`🏗️ [DistrictButtons] Rendered with ${districts.length} districts and ${buildings.length} buildings`);

    const handleDistrictClick = (district) => {
        setCurrentDistrict(district);
        getBuildings(district._id);
    };

    const getDistrictStats = (district) => {
        // Calculate accurate building count from current buildings data
        console.log(`🔍 [DistrictButtons] Calculating stats for district: ${district.name}`);
        console.log(`🔍 [DistrictButtons] Total buildings received:`, buildings.length);
        // Check both building and flat structures for district information
        const sampleBuilding = buildings[0];
        const sampleFlat = sampleBuilding?.flats?.[0];
        
        console.log(`🔍 [DistrictButtons] Sample building keys:`, Object.keys(sampleBuilding || {}));
        console.log(`🔍 [DistrictButtons] Sample building structure:`, sampleBuilding);
        
        // Check various possible district field names in both building and flat
        const possibleDistrictFields = ['wijk', 'district', 'wijkNaam', 'districtName', 'gebied', 'zone', 'districtId'];
        
        console.log(`🔍 [DistrictButtons] Checking for district fields in building...`);
        possibleDistrictFields.forEach(fieldName => {
            const buildingValue = sampleBuilding?.[fieldName];
            if (buildingValue !== undefined && buildingValue !== null && buildingValue !== '') {
                console.log(`✅ [DistrictButtons] Found district field in BUILDING "${fieldName}": "${buildingValue}"`);
            }
        });
        
        console.log(`🔍 [DistrictButtons] Checking for district fields in flat...`);
        possibleDistrictFields.forEach(fieldName => {
            const flatValue = sampleFlat?.[fieldName];
            if (flatValue !== undefined && flatValue !== null && flatValue !== '') {
                console.log(`✅ [DistrictButtons] Found district field in FLAT "${fieldName}": "${flatValue}"`);
            }
        });
        
        console.log(`🔍 [DistrictButtons] Looking for district name: "${district.name}"`);
        
        const matchingBuildings = buildings.filter(building => {
            // Match by district ID (building.district should equal district._id)
            const matches = building.district === district._id;
            if (matches) {
                console.log(`✅ [DistrictButtons] Found matching building: ${building.address} in district ${district.name}`);
            }
            return matches;
        });
        
        const buildingCount = matchingBuildings.length;
        console.log(`📊 [DistrictButtons] District "${district.name}" has ${buildingCount} buildings`);
        
        const priority = district.priority || 0;
        return { buildingCount, priority };
    };

    if (districts.length === 0) {
        return (
            <div className="districts-empty-state">
                <div className="empty-state-icon">📁</div>
                <h3>No Districts Available</h3>
                <p>Create districts through the enhanced management panel to get started.</p>
            </div>
        );
    }

    return (
        <div className="districts-container">
            <div className="districts-header">
                <h3 className="districts-title">
                    <span className="districts-icon">🗂️</span>
                    District Navigation
                    <span className="districts-count">({districts.length})</span>
                </h3>
                <div className="districts-help">
                    <span className="help-icon">💡</span>
                    <span className="help-text">Drag to reorder • Click to view</span>
                </div>
            </div>
            
            <div className="districts-grid">
                {districts.map((district, index) => {
                    const stats = getDistrictStats(district);
                    const isActive = currentDistrict?._id === district._id;
                    
                    return (
                        <Draggable key={district._id} draggableId={district._id} index={index}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`district-card ${isActive ? 'active' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                                >
                                    {/* Drag Handle */}
                                    <div 
                                        {...provided.dragHandleProps}
                                        className="district-drag-handle"
                                        title="Drag to reorder districts"
                                    >
                                        <div className="drag-dots">
                                            <div className="drag-dot"></div>
                                            <div className="drag-dot"></div>
                                            <div className="drag-dot"></div>
                                            <div className="drag-dot"></div>
                                            <div className="drag-dot"></div>
                                            <div className="drag-dot"></div>
                                        </div>
                                    </div>

                                    {/* District Content */}
                                    <div className="district-content">
                                        <div className="district-header">
                                            <div className="district-info">
                                                <h4 className="district-name">{district.name}</h4>
                                                <div className="district-metadata">
                                                    <span className="district-priority">#{stats.priority}</span>
                                                    <span className="district-buildings">
                                                        🏢 {stats.buildingCount} buildings
                                                    </span>
                                                </div>
                                            </div>
                                            {isActive && (
                                                <div className="active-indicator">
                                                    <span className="active-dot"></span>
                                                    <span className="active-text">Current</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleDistrictClick(district)}
                                            className={`district-button ${isActive ? 'active' : ''}`}
                                            disabled={isActive}
                                        >
                                            {isActive ? (
                                                <>
                                                    <span className="button-icon">✓</span>
                                                    Currently Viewing
                                                </>
                                            ) : (
                                                <>
                                                    <span className="button-icon">👁️</span>
                                                    View Buildings
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Draggable>
                    );
                })}
            </div>
        </div>
    );
};

export default DistrictButtons;
