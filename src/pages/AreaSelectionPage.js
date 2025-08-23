// Page for selecting geographical areas within a city for navigation and organization.

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
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                background: '#ffffff',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
            }}>
                {/* Header Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    padding: '40px',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    {/* Breadcrumb */}
                    <div style={{
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '16px'
                    }}>
                        <Link 
                            to="/city" 
                            style={{
                                color: '#667eea',
                                textDecoration: 'none',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            🏙️ Cities
                        </Link>
                        <span style={{color: '#6c757d'}}>→</span>
                        <span style={{color: '#1e293b', fontWeight: '600'}}>{cityName || 'Loading...'}</span>
                    </div>

                    <div className="modern-header">
                        <h1 style={{ 
                            color: '#2c3e50', 
                            fontSize: '32px', 
                            fontWeight: '700',
                            margin: '0 0 10px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{fontSize: '36px'}}>🗺️</span>
                            Area Management
                        </h1>
                        <p style={{ 
                            color: '#6c757d', 
                            fontSize: '18px', 
                            margin: '0',
                            fontWeight: '400'
                        }}>
                            Manage areas within <strong style={{color: '#1e293b'}}>{cityName}</strong> for organized district planning
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div style={{ padding: '40px' }}>
                    {/* Add New Area Section */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                        border: '2px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '32px',
                        marginBottom: '32px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                    }}>
                        <h2 style={{
                            color: '#1e293b',
                            fontSize: '24px',
                            fontWeight: '600',
                            margin: '0 0 24px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{fontSize: '24px'}}>➕</span>
                            Add New Area
                        </h2>
                        <AreaForm cityId={cityId} onAddArea={handleAddArea}/>
                    </div>
                    {/* Error Display */}
                    {error && (
                        <div style={{
                            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                            border: '2px solid #fecaca',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{fontSize: '24px'}}>⚠️</span>
                            <span style={{color: '#dc2626', fontWeight: '500', flex: 1}}>{error}</span>
                            <button 
                                className="modern-button modern-button-ghost"
                                onClick={() => setError(null)}
                                style={{padding: '8px 16px', fontSize: '14px'}}
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                    {/* Existing Areas Section */}
                    <div style={{
                        background: '#ffffff',
                        border: '2px solid #e2e8f0',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            padding: '24px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{
                                color: '#1e293b',
                                fontSize: '22px',
                                fontWeight: '600',
                                margin: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <span style={{fontSize: '22px'}}>📍</span>
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
                                        gap: '8px'
                                    }}
                                >
                                    🔄 Refresh
                                </button>
                            )}
                        </div>
                        <div style={{ padding: '32px' }}>
                            {isLoading ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '60px 20px',
                                    gap: '20px'
                                }}>
                                    <BounceLoader color="#667eea" size={50}/>
                                    <p style={{color: '#6c757d', fontSize: '16px', margin: '0'}}>Loading areas...</p>
                                </div>
                            ) : areas.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '60px 20px',
                                    color: '#6c757d'
                                }}>
                                    <div style={{fontSize: '64px', marginBottom: '20px'}}>🗺️</div>
                                    <h3 style={{fontSize: '20px', fontWeight: '600', margin: '0 0 12px 0'}}>No Areas Yet</h3>
                                    <p style={{fontSize: '16px', margin: '0'}}>Create your first area to organize districts within this city.</p>
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
            </div>
        </div>
    );
};
export default AreaSelectionPage;
