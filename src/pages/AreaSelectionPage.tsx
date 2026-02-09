// Page for selecting geographical areas within a city for navigation and organization.

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import AreaForm from '../components/AreaForm';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { ConfirmModal } from '../components/ui';
import Breadcrumb from '../components/Breadcrumb';
import LoadingSpinner from '../components/LoadingSpinner';
import { useError } from '../context/ErrorProvider';
import { useNotification } from '../context/NotificationProvider';
import logger from '../utils/logger';
import './pages.css';

interface District {
    _id: string;
    name: string;
}

interface Area {
    _id: string;
    name: string;
    districts: District[];
    numberOfDistricts?: number;
}

interface City {
    _id: string;
    name: string;
}

interface DeleteModalState {
    isOpen: boolean;
    area: Area | null;
}

const AreaSelectionPage: React.FC = () => {
    const { cityId } = useParams<{ cityId: string }>();
    const [areas, setAreas] = useState<Area[]>([]);
    const [cityName, setCityName] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false, area: null });
    const axiosPrivate = useAxiosPrivate();
    const { handleApiError } = useError();
    const { showSuccess, showError } = useNotification();

    const fetchAreas = useCallback(async (): Promise<void> => {
        if (!cityId) return;
        try {
            setIsLoading(true);
            setError(null);
            const response = await axiosPrivate.get<Area[]>(`/api/area/${cityId}`);
            const areasWithDistricts = response.data.map((area) => ({
                ...area,
                numberOfDistricts: area.districts.length,
            }));
            setAreas(areasWithDistricts);
            try {
                const cityResponse = await axiosPrivate.get<City>(`/api/city/${cityId}`);
                setCityName(cityResponse.data.name);
            } catch (cityError) {
                logger.error('Failed to fetch city name:', cityError);
            }
        } catch (err) {
            logger.error('Failed to fetch areas:', err);
            handleApiError(err, 'Failed to load areas. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate, cityId]);

    useEffect(() => {
        fetchAreas();
    }, [fetchAreas]);

    const handleAddArea = useCallback(
        async (newArea: { name: string }): Promise<void> => {
            try {
                const response = await axiosPrivate.post<Area>(`/api/area/${cityId}`, newArea);
                const addedArea = response.data;
                addedArea.numberOfDistricts = 0;
                setAreas((prevAreas) => [...prevAreas, addedArea]);
                showSuccess(`Area "${addedArea.name}" created successfully`);
            } catch (err) {
                logger.error('Failed to add area:', err);
                showError('Failed to add area. Please try again.');
            }
        },
        [axiosPrivate, cityId, showSuccess, showError]
    );

    const handleDeleteClick = useCallback((area: Area): void => {
        setDeleteModal({ isOpen: true, area });
    }, []);

    const handleConfirmDelete = useCallback(async (): Promise<void> => {
        const area = deleteModal.area;
        if (!area) return;

        try {
            setIsDeleting(area._id);
            setDeleteModal({ isOpen: false, area: null });
            await axiosPrivate.delete(`/api/area/${area._id}`);
            setAreas((prevAreas) => prevAreas.filter((a) => a._id !== area._id));
            showSuccess(`Area "${area.name}" deleted successfully`);
        } catch (err) {
            logger.error('Failed to delete area:', err);
            showError('Failed to delete area. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    }, [axiosPrivate, deleteModal.area, showSuccess, showError]);

    return (
        <div className="page-wrapper">
            <div className="page-container">
                {/* Header Section */}
                <div className="page-header">
                    {/* Breadcrumb */}
                    <Breadcrumb
                        items={[
                            { label: 'Cities', path: '/city' },
                            { label: cityName || 'Loading...' },
                        ]}
                    />

                    <div className="modern-header">
                        <h1 className="page-title">
                            <span style={{ fontSize: '36px' }}>🗺️</span>
                            Area Management
                        </h1>
                        <p className="page-subtitle">
                            Manage areas within <strong style={{ color: '#1e293b' }}>{cityName}</strong> for organized district
                            planning
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="page-content-padding">
                    {/* Add New Area Section */}
                    <div className="page-section">
                        <h2 className="page-section-header">
                            <span style={{ fontSize: '24px' }}>➕</span>
                            Add New Area
                        </h2>
                        <AreaForm cityId={cityId || ''} onAddArea={handleAddArea} />
                    </div>
                    {/* Error Display */}
                    {error && (
                        <div className="page-error-display">
                            <span style={{ fontSize: '24px' }}>⚠️</span>
                            <span style={{ color: '#dc2626', fontWeight: '500', flex: 1 }}>{error}</span>
                            <button
                                className="modern-button modern-button-ghost"
                                onClick={() => setError(null)}
                                style={{ padding: '8px 16px', fontSize: '14px' }}
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                    {/* Existing Areas Section */}
                    <div className="page-list-wrapper">
                        <div className="page-list-header">
                            <h2 className="page-list-title">
                                <span style={{ fontSize: '22px' }}>📍</span>
                                Areas in {cityName} ({areas.length})
                            </h2>
                            {!isLoading && (
                                <button
                                    className="modern-button modern-button-ghost"
                                    onClick={fetchAreas}
                                    title="Refresh areas list"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    🔄 Refresh
                                </button>
                            )}
                        </div>
                        <div className="page-list-content">
                            {isLoading ? (
                                <LoadingSpinner size="medium" color="#667eea" text="Loading areas..." />
                            ) : areas.length === 0 ? (
                                <div className="page-empty-state">
                                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗺️</div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 12px 0' }}>No Areas Yet</h3>
                                    <p style={{ fontSize: '16px', margin: '0' }}>
                                        Create your first area to organize districts within this city.
                                    </p>
                                </div>
                            ) : (
                                <div className="modern-grid">
                                    {areas.map((area) => (
                                        <div key={area._id} className="modern-card-cell">
                                            <Link to={`/district/${area._id}`} className="modern-card-cell-content">
                                                <div className="modern-card-cell-icon">🗺️</div>
                                                <h3 className="modern-card-cell-title">{area.name}</h3>
                                                <div className="modern-card-cell-stats">
                                                    <span className="modern-stat-number">{area.numberOfDistricts}</span>
                                                    <span className="modern-stat-label">Districts</span>
                                                </div>
                                            </Link>
                                            <div className="modern-card-cell-actions">
                                                <button
                                                    onClick={() => handleDeleteClick(area)}
                                                    className="modern-button-cell-action modern-button-cell-danger"
                                                    disabled={isDeleting === area._id}
                                                    title="Delete area"
                                                >
                                                    {isDeleting === area._id ? (
                                                        <LoadingSpinner size="small" color="#fff" />
                                                    ) : (
                                                        <>
                                                            <span style={{ fontSize: '14px', marginRight: '4px' }}>🗑️</span>
                                                            Delete
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete Area"
                message={`Are you sure you want to delete "${deleteModal.area?.name}"? This will also delete all associated districts.`}
                confirmText="Delete"
                confirmVariant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, area: null })}
            />
        </div>
    );
};

export default AreaSelectionPage;
