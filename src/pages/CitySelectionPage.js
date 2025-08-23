// Page for selecting cities in the geographical navigation hierarchy.

import React, {useEffect, useState, useCallback} from 'react';
import {Link} from 'react-router-dom';
import CityForm from '../components/CityForm';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import {BounceLoader} from 'react-spinners';
const CitySelectionPage = () => {
    const [cities, setCities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const axiosPrivate = useAxiosPrivate();
    const fetchCities = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await axiosPrivate.get('/api/city');
            const citiesWithAreas = response.data.map(city => ({
                ...city,
                numberOfAreas: city.areas.length 
            }));
            setCities(citiesWithAreas);
        } catch (error) {
            console.error('Failed to fetch cities:', error);
            setError('Failed to load cities. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate]);
    useEffect(() => {
        fetchCities();
    }, [fetchCities]);
    const handleAddCity = useCallback(async (newCity) => {
        try {
            const response = await axiosPrivate.post('/api/city', newCity);
            const addedCity = response.data;
            addedCity.numberOfAreas = 0;
            setCities(prevCities => [...prevCities, addedCity]);
        } catch (error) {
            console.error('Failed to add city:', error);
            setError('Failed to add city. Please try again.');
        }
    }, [axiosPrivate]);
    const handleDeleteCity = useCallback(async (cityId) => {
        if (!window.confirm('Are you sure you want to delete this city? This will also delete all associated areas and districts.')) {
            return;
        }
        try {
            setIsDeleting(cityId);
            await axiosPrivate.delete(`/api/city/${cityId}`);
            setCities(prevCities => prevCities.filter(city => city._id !== cityId));
        } catch (error) {
            console.error('Failed to delete city:', error);
            setError('Failed to delete city. Please try again.');
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
                            <span style={{fontSize: '36px'}}>🏙️</span>
                            City Management
                        </h1>
                        <p style={{ 
                            color: '#6c757d', 
                            fontSize: '18px', 
                            margin: '0',
                            fontWeight: '400'
                        }}>
                            Manage cities and their areas for fiber installation projects
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div style={{ padding: '40px' }}>
                    {/* Add New City Section */}
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
                            Add New City
                        </h2>
                        <CityForm onAddCity={handleAddCity}/>
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
                    {/* Existing Cities Section */}
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
                                    <p style={{color: '#6c757d', fontSize: '16px', margin: '0'}}>Loading cities...</p>
                                </div>
                            ) : cities.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '60px 20px',
                                    color: '#6c757d'
                                }}>
                                    <div style={{fontSize: '64px', marginBottom: '20px'}}>🏙️</div>
                                    <h3 style={{fontSize: '20px', fontWeight: '600', margin: '0 0 12px 0'}}>No Cities Yet</h3>
                                    <p style={{fontSize: '16px', margin: '0'}}>Create your first city to get started with managing fiber installation projects.</p>
                                </div>
                            ) : (
                                <div className="modern-grid">{cities.map((city) => (
                                        <div key={city._id} className="modern-card-cell">
                                            <Link to={`/area/${city._id}`} className="modern-card-cell-content">
                                                <div className="modern-card-cell-icon">
                                                    🏙️
                                                </div>
                                                <h3 className="modern-card-cell-title">{city.name}</h3>
                                                <div className="modern-card-cell-stats">
                                                    <span className="modern-stat-number">{city.numberOfAreas}</span>
                                                    <span className="modern-stat-label">Areas</span>
                                                </div>
                                            </Link>
                                            <div className="modern-card-cell-actions">
                                                <button
                                                    onClick={() => handleDeleteCity(city._id)}
                                                    className="modern-button-cell-action modern-button-cell-danger"
                                                    disabled={isDeleting === city._id}
                                                    title="Delete city"
                                                >
                                                    {isDeleting === city._id ? (
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
}
export default CitySelectionPage;