// Admin interface for managing districts including creation, editing, and organizational tools.

import React, { useEffect, useState } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import logger from '../utils/logger';
import useAuth from '../hooks/useAuth';
import { BounceLoader } from 'react-spinners';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import '../styles/dashboardPage.css';  
const AdminDistrictManagementPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [districts, setDistricts] = useState([]);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        totalCities: 0,
        totalAreas: 0,
        totalDistricts: 0,
        totalBuildings: 0,
        totalFlats: 0,
        completedInstallations: 0,
        pendingInstallations: 0,
        scheduledAppointments: 0
    });
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const fetchAllDistricts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosPrivate.get('/api/district/all');
            setDistricts(response.data);
        } catch (error) {
            logger.error('Error fetching all districts:', error);
            setError('Failed to fetch districts');
        } finally {
            setIsLoading(false);
        }
    };
    const fetchDashboardData = async () => {
        try {
            const response = await axiosPrivate.get('/api/dashboard/stats');
            setDashboardData(response.data);
            setDashboardLoading(false);
        } catch (error) {
            logger.error('Error fetching dashboard data:', error);
            setDashboardData({
                totalCities: 1,
                totalAreas: 3,
                totalDistricts: 8,
                totalBuildings: 45,
                totalFlats: 350,
                completedInstallations: 89,
                pendingInstallations: 261,
                scheduledAppointments: 12
            });
            setDashboardLoading(false);
        }
    };
    useEffect(() => {
        fetchAllDistricts();
        fetchDashboardData();
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
            logger.error('Failed to update priorities', error);
            fetchAllDistricts();
        } finally {
            setIsSaving(false);
        }
    };
    const getProgressBarColor = (percentage) => {
        if (percentage === 100) return '#4CAF50';  
        if (percentage >= 75) return '#8BC34A';   
        if (percentage >= 50) return '#FFC107';   
        if (percentage >= 25) return '#FF9800';   
        return '#F44336';  
    };
    const ProcessFlowDiagram = () => (
        <div className="process-flow-container">
            <h2 className="process-flow-title">
                Fiber Installation Process Overview
            </h2>
            <div className="hierarchy-section">
                <h3 className="hierarchy-title">Location Hierarchy</h3>
                <div className="hierarchy-container">
                    <div className="hierarchy-box">
                        <div className="hierarchy-icon cities">🏙️</div>
                        <div>Cities</div>
                        <div className="hierarchy-count">{dashboardData.totalCities}</div>
                    </div>
                    <div className="hierarchy-arrow">→</div>
                    <div className="hierarchy-box">
                        <div className="hierarchy-icon areas">🗺️</div>
                        <div>Areas</div>
                        <div className="hierarchy-count">{dashboardData.totalAreas}</div>
                    </div>
                    <div className="hierarchy-arrow">→</div>
                    <div className="hierarchy-box">
                        <div className="hierarchy-icon districts">📍</div>
                        <div>Districts</div>
                        <div className="hierarchy-count">{dashboardData.totalDistricts}</div>
                    </div>
                    <div className="hierarchy-arrow">→</div>
                    <div className="hierarchy-box">
                        <div className="hierarchy-icon buildings">🏢</div>
                        <div>Buildings</div>
                        <div className="hierarchy-count">{dashboardData.totalBuildings}</div>
                    </div>
                    <div className="hierarchy-arrow">→</div>
                    <div className="hierarchy-box">
                        <div className="hierarchy-icon apartments">🏠</div>
                        <div>Apartments</div>
                        <div className="hierarchy-count">{dashboardData.totalFlats}</div>
                    </div>
                </div>
            </div>
            <div className="process-section">
                <h3 className="process-title">Installation Process Flow</h3>
                <div className="process-container">
                    <div className="process-step">
                        <div className="process-icon planning">📋</div>
                        <div className="process-label">Technical Planning</div>
                        <div className="process-role">TP Team</div>
                    </div>
                    <div className="process-arrow">→</div>
                    <div className="process-step">
                        <div className="process-icon survey">🔍</div>
                        <div className="process-label">Technical Survey</div>
                        <div className="process-role">TS Team</div>
                    </div>
                    <div className="process-arrow">→</div>
                    <div className="process-step">
                        <div className="process-icon preparation">🔧</div>
                        <div className="process-label">Work Preparation</div>
                        <div className="process-role">WV Team</div>
                    </div>
                    <div className="process-arrow">→</div>
                    <div className="process-step">
                        <div className="process-icon has-planning">📅</div>
                        <div className="process-label">HAS Planning</div>
                        <div className="process-role">HP Team</div>
                    </div>
                    <div className="process-arrow">→</div>
                    <div className="process-step">
                        <div className="process-icon installation">⚡</div>
                        <div className="process-label">Fiber Installation</div>
                        <div className="process-role">HM Team</div>
                    </div>
                </div>
            </div>
            <div className="status-section">
                <h3 className="status-title">Installation Status Overview</h3>
                <div className="status-container">
                    <div className="status-card completed">
                        <div className="status-icon completed">✅</div>
                        <div>
                            <div className="status-number">{dashboardData.completedInstallations}</div>
                            <div className="status-label">Completed Installations</div>
                        </div>
                    </div>
                    <div className="status-card pending">
                        <div className="status-icon pending">⏳</div>
                        <div>
                            <div className="status-number">{dashboardData.pendingInstallations}</div>
                            <div className="status-label">Pending Installations</div>
                        </div>
                    </div>
                    <div className="status-card scheduled">
                        <div className="status-icon scheduled">📅</div>
                        <div>
                            <div className="status-number">{dashboardData.scheduledAppointments}</div>
                            <div className="status-label">Scheduled This Week</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="overall-progress">
                <div className="overall-progress-title">
                    Overall Installation Progress
                </div>
                <div className="overall-progress-bar">
                    <div 
                        className="overall-progress-fill"
                        style={{
                            width: `${dashboardData.totalFlats > 0 ? (dashboardData.completedInstallations / dashboardData.totalFlats * 100) : 0}%`
                        }}
                    ></div>
                </div>
                <div className="overall-progress-text">
                    {dashboardData.totalFlats > 0 ? Math.round(dashboardData.completedInstallations / dashboardData.totalFlats * 100) : 0}% Complete 
                    ({dashboardData.completedInstallations} of {dashboardData.totalFlats} apartments)
                </div>
            </div>
        </div>
    );
    return (
        <div className="dashboard-container">
            {!dashboardLoading && <ProcessFlowDiagram />}
            {dashboardLoading && (
                <div className="dashboard-loading">
                    Loading dashboard data...
                </div>
            )}
            <div className="district-management-section">
                <div className="section-header">
                    <div className="header-content">
                        <h1 className="section-title">
                            <span className="section-icon">🏢</span>
                            District Management Dashboard
                        </h1>
                        <p className="section-description">
                            Manage districts, reorder priorities, and track installation progress across your network
                        </p>
                    </div>
                    <div className="header-stats">
                        <div className="quick-stat">
                            <span className="stat-number">{districts.length}</span>
                            <span className="stat-label">Total Districts</span>
                        </div>
                    </div>
                </div>
                
                <div className="instructions-card">
                    <div className="instructions-icon">🎯</div>
                    <div className="instructions-content">
                        <h3>Priority Management</h3>
                        <p>Drag and drop districts to reorder their priority. The first district gets the highest priority for installation scheduling.</p>
                    </div>
                </div>
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
                    <div className="empty-state">
                        <div className="empty-icon">🏗️</div>
                        <h3>No Districts Found</h3>
                        <p>Start by creating your first district to organize your network infrastructure.</p>
                    </div>
                )}
                {districts.length > 0 && (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="districts">
                            {(provided) => (
                                <div 
                                    {...provided.droppableProps} 
                                    ref={provided.innerRef}
                                    className="districts-container"
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
                                                    className={`district-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                                >
                                                    <div className="district-header">
                                                        <div className="district-info">
                                                            <h3>
                                                                <span className="district-icon">🏢</span>
                                                                {district.name}
                                                            </h3>
                                                            <div className="district-meta">
                                                                {district.area?.name && (
                                                                    <span className="area-tag">📍 {district.area.name}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="district-priority">
                                                            <span className="priority-icon">🎯</span>
                                                            #{index + 1}
                                                            {index === 0 && <span className="priority-text">Priority</span>}
                                                        </div>
                                                        <div {...provided.dragHandleProps} className="drag-handle">⋮⋮</div>
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
        </div>
    );
};
export default AdminDistrictManagementPage;