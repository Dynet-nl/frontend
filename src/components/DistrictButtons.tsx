// Component displaying district navigation with modern UI, drag & drop reordering, and clear visual feedback.

import React from 'react';
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import '../styles/districtButtons.css';
import logger from '../utils/logger';

interface District {
    _id: string;
    name: string;
    priority?: number;
}

interface Building {
    district: string;
}

interface DistrictStats {
    buildingCount: number;
    priority: number;
}

interface DistrictButtonsProps {
    districts?: District[];
    getBuildings: (districtId: string) => void;
    setCurrentDistrict: (district: District) => void;
    currentDistrict?: District | null;
    buildings?: Building[];
}

const DistrictButtons: React.FC<DistrictButtonsProps> = ({
    districts = [],
    getBuildings,
    setCurrentDistrict,
    currentDistrict,
    buildings = []
}) => {
    logger.debug(`DistrictButtons rendered with ${districts.length} districts and ${buildings.length} buildings`);

    const handleDistrictClick = (district: District): void => {
        setCurrentDistrict(district);
        getBuildings(district._id);
    };

    const getDistrictStats = (district: District): DistrictStats => {
        const matchingBuildings = buildings.filter(building => building.district === district._id);
        const buildingCount = matchingBuildings.length;
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
                            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
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
