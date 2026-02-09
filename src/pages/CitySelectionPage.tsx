// Page for selecting cities in the geographical navigation hierarchy.

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import CityForm from '../components/CityForm';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { BounceLoader } from 'react-spinners';
import { ConfirmModal } from '../components/ui';
import { useNotification } from '../context/NotificationProvider';
import logger from '../utils/logger';
import './pages.css';

interface Area {
    _id: string;
    name: string;
}

interface City {
    _id: string;
    name: string;
    areas: Area[];
    numberOfAreas?: number;
}

interface DeleteModalState {
    isOpen: boolean;
    city: City | null;
}

const CitySelectionPage: React.FC = () => {
    const [cities, setCities] = useState<City[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false, city: null });
    const axiosPrivate = useAxiosPrivate();
    const { showSuccess, showError } = useNotification();

    const fetchCities = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await axiosPrivate.get<City[]>('/api/city');
            const citiesWithAreas = response.data.map((city) => ({
                ...city,
                numberOfAreas: city.areas.length,
            }));
            setCities(citiesWithAreas);
        } catch (err) {
            logger.error('Failed to fetch cities:', err);
            setError('Failed to load cities. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate]);

    useEffect(() => {
        fetchCities();
    }, [fetchCities]);

    const handleAddCity = useCallback(
        async (newCity: { name: string }): Promise<void> => {
            try {
                const response = await axiosPrivate.post<City>('/api/city', newCity);
                const addedCity = response.data;
                addedCity.numberOfAreas = 0;
                setCities((prevCities) => [...prevCities, addedCity]);
                showSuccess(`City "${addedCity.name}" created successfully`);
            } catch (err) {
                logger.error('Failed to add city:', err);
                showError('Failed to add city. Please try again.');
            }
        },
        [axiosPrivate, showSuccess, showError]
    );

    const handleDeleteClick = useCallback((city: City): void => {
        setDeleteModal({ isOpen: true, city });
    }, []);

    const handleConfirmDelete = useCallback(async (): Promise<void> => {
        const city = deleteModal.city;
        if (!city) return;

        try {
            setIsDeleting(city._id);
            setDeleteModal({ isOpen: false, city: null });
            await axiosPrivate.delete(`/api/city/${city._id}`);
            setCities((prevCities) => prevCities.filter((c) => c._id !== city._id));
            showSuccess(`City "${city.name}" deleted successfully`);
        } catch (err) {
            logger.error('Failed to delete city:', err);
            showError('Failed to delete city. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    }, [axiosPrivate, deleteModal.city, showSuccess, showError]);

    return (
        <div className="page-wrapper">
            <div className="page-container">
                {/* Header Section */}
                <div className="page-header">
                    <div className="modern-header">
                        <h1 className="page-title">
                            <span style={{ fontSize: '36px' }}>🏙️</span>
                            City Management
                        </h1>
                        <p className="page-subtitle">
                            Manage cities and their areas for fiber installation projects
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="page-content-padding">
                    {/* Add New City Section */}
                    <div className="page-section">
                        <h2 className="page-section-header">
                            <span style={{ fontSize: '24px' }}>➕</span>
                            Add New City
                        </h2>
                        <CityForm onAddCity={handleAddCity} />
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
                    {/* Existing Cities Section */}
                    <div className="page-list-wrapper">
                        <div className="page-list-header">
                            <h2 className="page-list-title">
                                <span style={{ fontSize: '22px' }}>📍</span>
                                Existing Cities ({cities.length})
                            </h2>
                            {!isLoading && (
                                <button
                                    className="modern-button modern-button-ghost"
                                    onClick={fetchCities}
                                    title="Refresh cities list"
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
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '60px 20px',
                                        gap: '20px',
                                    }}
                                >
                                    <BounceLoader color="#667eea" size={50} />
                                    <p style={{ color: '#6c757d', fontSize: '16px', margin: '0' }}>Loading cities...</p>
                                </div>
                            ) : cities.length === 0 ? (
                                <div className="page-empty-state">
                                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏙️</div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 12px 0' }}>No Cities Yet</h3>
                                    <p style={{ fontSize: '16px', margin: '0' }}>
                                        Create your first city to get started with managing fiber installation projects.
                                    </p>
                                </div>
                            ) : (
                                <div className="modern-grid">
                                    {cities.map((city) => (
                                        <div key={city._id} className="modern-card-cell">
                                            <Link to={`/area/${city._id}`} className="modern-card-cell-content">
                                                <div className="modern-card-cell-icon">🏙️</div>
                                                <h3 className="modern-card-cell-title">{city.name}</h3>
                                                <div className="modern-card-cell-stats">
                                                    <span className="modern-stat-number">{city.numberOfAreas}</span>
                                                    <span className="modern-stat-label">Areas</span>
                                                </div>
                                            </Link>
                                            <div className="modern-card-cell-actions">
                                                <button
                                                    onClick={() => handleDeleteClick(city)}
                                                    className="modern-button-cell-action modern-button-cell-danger"
                                                    disabled={isDeleting === city._id}
                                                    title="Delete city"
                                                >
                                                    {isDeleting === city._id ? (
                                                        <BounceLoader color="#fff" size={14} />
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
                title="Delete City"
                message={`Are you sure you want to delete "${deleteModal.city?.name}"? This will also delete all associated areas and districts.`}
                confirmText="Delete"
                confirmVariant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, city: null })}
            />
        </div>
    );
};

export default CitySelectionPage;
