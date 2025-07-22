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
            
            // Optimized: Just set numberOfAreas to 0 for new cities instead of making extra API call
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
        <div className="modern-container">
            {/* Header Section */}
            <div className="modern-header" style={{marginBottom: '32px'}}>
                <h1 className="modern-title">City Management</h1>
                <p className="modern-subtitle">Manage cities and their areas for fiber installation projects</p>
            </div>

            {/* Add New City Section */}
            <div className="modern-card" style={{marginBottom: '32px'}}>
                <div className="modern-card-header">
                    <h2 className="modern-card-title">
                        <span style={{fontSize: '20px', marginRight: '8px'}}>🏙️</span>
                        Add New City
                    </h2>
                </div>
                <div className="modern-card-body">
                    <CityForm onAddCity={handleAddCity}/>
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

            {/* Cities Grid Section */}
            <div className="modern-card">
                <div className="modern-card-header">
                    <h2 className="modern-card-title">
                        <span style={{fontSize: '20px', marginRight: '8px'}}>📍</span>
                        Existing Cities ({cities.length})
                    </h2>
                    {!isLoading && (
                        <button 
                            className="modern-button modern-button-ghost"
                            onClick={fetchCities}
                            title="Refresh cities list"
                        >
                            🔄 Refresh
                        </button>
                    )}
                </div>
                <div className="modern-card-body">
                    {isLoading ? (
                        <div className="modern-loading-container">
                            <BounceLoader color="#3498db" size={40}/>
                            <p className="modern-text-muted">Loading cities...</p>
                        </div>
                    ) : cities.length === 0 ? (
                        <div className="modern-empty-state">
                            <div style={{fontSize: '48px', marginBottom: '16px'}}>🏙️</div>
                            <h3 className="modern-text-muted">No Cities Yet</h3>
                            <p className="modern-text-muted">Create your first city to get started with managing fiber installation projects.</p>
                        </div>
                    ) : (
                        <div className="modern-grid">
                            {cities.map((city) => (
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
    );
}

export default CitySelectionPage;