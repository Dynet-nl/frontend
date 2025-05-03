// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { BounceLoader } from 'react-spinners';

const DashboardPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const [isLoading, setIsLoading] = useState(false);
    const [districts, setDistricts] = useState([]);
    const [error, setError] = useState(null);

    const fetchAllDistricts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Correct endpoint path
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

    return (
        <div className="dashboard-container" style={{ padding: '20px' }}>
            <h1>Admin Dashboard</h1>
            
            {isLoading && (
                <div style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    border: 0 
                }}>
                    <BounceLoader color="#3498db" />
                </div>
            )}

            {error && (
                <div style={{ color: 'red', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            <h2>All Districts</h2>
            
            {!isLoading && districts.length === 0 && !error && (
                <p>No districts found.</p>
            )}

            {districts.length > 0 && (
                <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                    {districts.map((district) => (
                        <div 
                            key={district._id} 
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '15px',
                                backgroundColor: '#f9f9f9'
                            }}
                        >
                            <h3 style={{ margin: '0 0 10px 0' }}>{district.name}</h3>
                            <p style={{ color: '#666', margin: '5px 0' }}>
                                ID: {district._id}
                            </p>
                            {district.area?.name && (
                                <p style={{ color: '#666', margin: '5px 0' }}>
                                    Area: {district.area.name}
                                </p>
                            )}
                            {district.buildings && (
                                <p style={{ color: '#666', margin: '5px 0' }}>
                                    Buildings: {district.buildings.length}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;