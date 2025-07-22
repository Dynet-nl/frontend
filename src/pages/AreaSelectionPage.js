import React, {useEffect, useState, useCallback} from 'react';
import {Link, useParams} from 'react-router-dom';
import AreaForm from '../components/AreaForm';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import {BounceLoader} from 'react-spinners';

const AreaSelectionPage = () => {
    const {cityId} = useParams();
    const [areas, setAreas] = useState([]);
    const [cityName, setCityName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const axiosPrivate = useAxiosPrivate();

    const fetchAreas = useCallback(async () => {
        if (!cityId) return;
        
        try {
            setIsLoading(true);
            setError(null);
            const response = await axiosPrivate.get(`/api/area/${cityId}`);
            const areasWithDistricts = response.data.map(area => ({
                ...area,
                numberOfDistricts: area.districts.length
            }));
            setAreas(areasWithDistricts);
            
            // Fetch city name for breadcrumb
            try {
                const cityResponse = await axiosPrivate.get(`/api/city/${cityId}`);
                setCityName(cityResponse.data.name);
            } catch (cityError) {
                console.error('Failed to fetch city name:', cityError);
            }
        } catch (error) {
            console.error('Failed to fetch areas:', error);
            setError('Failed to load areas. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate, cityId]);

    useEffect(() => {
        fetchAreas();
    }, [fetchAreas]);

    const handleAddArea = useCallback(async (newArea) => {
        try {
            const response = await axiosPrivate.post(`/api/area/${cityId}`, newArea);
            const addedArea = response.data;

            // Optimized: Just set numberOfDistricts to 0 for new areas instead of making extra API call
            addedArea.numberOfDistricts = 0;

            setAreas(prevAreas => [...prevAreas, addedArea]);
        } catch (error) {
            console.error('Failed to add area:', error);
            setError('Failed to add area. Please try again.');
        }
    }, [axiosPrivate, cityId]);

    const handleDeleteArea = useCallback(async (areaId) => {
        if (!window.confirm('Are you sure you want to delete this area? This will also delete all associated districts.')) {
            return;
        }
        
        try {
            setIsDeleting(areaId);
            await axiosPrivate.delete(`/api/area/${areaId}`);
            setAreas(prevAreas => prevAreas.filter(area => area._id !== areaId));
        } catch (error) {
            console.error('Failed to delete area:', error);
            setError('Failed to delete area. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    }, [axiosPrivate]);

    return (
        <div className="modern-container">
            {/* Breadcrumb Navigation */}
            <div className="modern-breadcrumb" style={{marginBottom: '24px'}}>
                <Link to="/city" className="modern-breadcrumb-link">Cities</Link>
                <span className="modern-breadcrumb-separator">→</span>
                <span className="modern-breadcrumb-current">{cityName || 'Loading...'}</span>
            </div>

            {/* Header Section */}
            <div className="modern-header" style={{marginBottom: '32px'}}>
                <h1 className="modern-title">Area Management</h1>
                <p className="modern-subtitle">
                    Manage areas within <strong>{cityName}</strong> for organized district planning
                </p>
            </div>

            {/* Add New Area Section */}
            <div className="modern-card" style={{marginBottom: '32px'}}>
                <div className="modern-card-header">
                    <h2 className="modern-card-title">
                        <span style={{fontSize: '20px', marginRight: '8px'}}>🗺️</span>
                        Add New Area
                    </h2>
                </div>
                <div className="modern-card-body">
                    <AreaForm cityId={cityId} onAddArea={handleAddArea}/>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="modern-alert modern-alert-error" style={{marginBottom: '32px'}}>
                    <span style={{fontSize: '18px', marginRight: '8px'}}>⚠️</span>
                    {error}
                    <button 
                        className="modern-button modern-button-ghost"
                        onClick={() => setError(null)}
                        style={{marginLeft: '12px', padding: '4px 8px', fontSize: '12px'}}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Areas Grid Section */}
            <div className="modern-card">
                <div className="modern-card-header">
                    <h2 className="modern-card-title">
                        <span style={{fontSize: '20px', marginRight: '8px'}}>📍</span>
                        Areas in {cityName} ({areas.length})
                    </h2>
                    {!isLoading && (
                        <button 
                            className="modern-button modern-button-ghost"
                            onClick={fetchAreas}
                            title="Refresh areas list"
                        >
                            🔄 Refresh
                        </button>
                    )}
                </div>
                <div className="modern-card-body">
                    {isLoading ? (
                        <div className="modern-loading-container">
                            <BounceLoader color="#3498db" size={40}/>
                            <p className="modern-text-muted">Loading areas...</p>
                        </div>
                    ) : areas.length === 0 ? (
                        <div className="modern-empty-state">
                            <div style={{fontSize: '48px', marginBottom: '16px'}}>🗺️</div>
                            <h3 className="modern-text-muted">No Areas Yet</h3>
                            <p className="modern-text-muted">Create your first area to organize districts within this city.</p>
                        </div>
                    ) : (
                        <div className="modern-grid">
                            {areas.map((area) => (
                                <div key={area._id} className="modern-card-cell">
                                    <Link to={`/district/${area._id}`} className="modern-card-cell-content">
                                        <div className="modern-card-cell-icon">
                                            🗺️
                                        </div>
                                        <h3 className="modern-card-cell-title">{area.name}</h3>
                                        <div className="modern-card-cell-stats">
                                            <span className="modern-stat-number">{area.numberOfDistricts}</span>
                                            <span className="modern-stat-label">Districts</span>
                                        </div>
                                    </Link>
                                    <div className="modern-card-cell-actions">
                                        <button
                                            onClick={() => handleDeleteArea(area._id)}
                                            className="modern-button-cell-action modern-button-cell-danger"
                                            disabled={isDeleting === area._id}
                                            title="Delete area"
                                        >
                                            {isDeleting === area._id ? (
                                                <BounceLoader color="#fff" size={14}/>
                                            ) : (
                                                <>
                                                    <span style={{fontSize: '14px', marginRight: '4px'}}>🗑️</span>
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
    );
};

export default AreaSelectionPage;
