// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { BounceLoader } from 'react-spinners';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import '../styles/dashboardPage.css';  // Create this CSS file

const DashboardPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const [isLoading, setIsLoading] = useState(false);
    const [districts, setDistricts] = useState([]);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchAllDistricts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosPrivate.get('/api/district/all');
            setDistricts(response.data);
        } catch (error) {
            console.error('Error fetching all districts:', error);
            setError('Failed to fetch districts');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllDistricts();
    }, []);

    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(districts);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        setDistricts(items);
        setIsSaving(true);

        try {
            await axiosPrivate.post('/api/district/priority', {
                districts: items.map((district) => ({
                    id: district._id,
                })),
            });
        } catch (error) {
            console.error('Failed to update priorities', error);
            // Revert the local state on error
            fetchAllDistricts();
        } finally {
            setIsSaving(false);
        }
    };

    const getProgressBarColor = (percentage) => {
        if (percentage === 100) return '#4CAF50';  // Green
        if (percentage >= 75) return '#8BC34A';   // Light Green
        if (percentage >= 50) return '#FFC107';   // Amber
        if (percentage >= 25) return '#FF9800';   // Orange
        return '#F44336';  // Red
    };

    return (
        <div className="dashboard-container">
            <h1>District Management Dashboard</h1>
            <p className="instructions">
                Drag and drop districts to reorder their priority. First district gets highest priority.
            </p>
            
            {isLoading && (
                <div className="loading-overlay">
                    <BounceLoader color="#3498db" />
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {isSaving && (
                <div className="saving-message">
                    Saving priority changes...
                </div>
            )}

            {!isLoading && districts.length === 0 && !error && (
                <p>No districts found.</p>
            )}

            {districts.length > 0 && (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="districts">
                        {(provided) => (
                            <div 
                                {...provided.droppableProps} 
                                ref={provided.innerRef}
                                className="districts-list"
                            >
                                {districts.map((district, index) => (
                                    <Draggable 
                                        key={district._id} 
                                        draggableId={district._id} 
                                        index={index}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`district-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                            >
                                                <div className="district-header">
                                                    <div className="district-title">
                                                        <h3>
                                                            {district.name}
                                                            {index === 0 && 
                                                                <span className="priority-badge">
                                                                    HIGHEST PRIORITY
                                                                </span>
                                                            }
                                                        </h3>
                                                        <div className="district-info">
                                                            <span>Priority Rank: #{index + 1}</span>
                                                            {district.area?.name && (
                                                                <span> • Area: {district.area.name}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="drag-handle">⋮⋮</div>
                                                </div>

                                                <div className="stats-container">
                                                    <div className="stat-item">
                                                        <span className="stat-label">Total Flats:</span>
                                                        <span className="stat-value">{district.stats?.totalFlats || 0}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Completed:</span>
                                                        <span className="stat-value">{district.stats?.completedFlats || 0}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Remaining:</span>
                                                        <span className="stat-value">{district.stats?.remainingFlats || 0}</span>
                                                    </div>
                                                </div>

                                                <div className="progress-section">
                                                    <div className="progress-header">
                                                        <span>Progress</span>
                                                        <span>{district.stats?.completionPercentage || 0}%</span>
                                                    </div>
                                                    <div className="progress-bar-background">
                                                        <div 
                                                            className="progress-bar"
                                                            style={{ 
                                                                width: `${district.stats?.completionPercentage || 0}%`,
                                                                backgroundColor: getProgressBarColor(district.stats?.completionPercentage || 0)
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}
        </div>
    );
};

export default DashboardPage;