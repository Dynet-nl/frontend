import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import CityForm from '../components/CityForm';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const CitySelectionPage = () => {
    const [cities, setCities] = useState([]);
    const axiosPrivate = useAxiosPrivate();

    
    const fetchCities = async () => {
        try {
            const response = await axiosPrivate.get('/api/city');
            const citiesWithAreas = response.data.map(city => ({
                ...city,
                numberOfAreas: city.areas.length 
            }));
            setCities(citiesWithAreas);
        } catch (error) {
            console.error('Failed to fetch cities:', error);
        }
    };

    
    useEffect(() => {
        fetchCities();
    }, [axiosPrivate]);

    const handleAddCity = async (newCity) => {
        try {
            const response = await axiosPrivate.post('/api/city', newCity);
            const addedCity = response.data;

            const areasResponse = await axiosPrivate.get(`/api/area/${addedCity._id}`);
            let numberOfAreas = 0;
            if (areasResponse.data && Array.isArray(areasResponse.data)) {
                numberOfAreas = areasResponse.data.length;
            }

            addedCity.numberOfAreas = numberOfAreas;

            setCities(prevCities => [...prevCities, addedCity]);
        } catch (error) {
            console.error('Failed to add city:', error);
        }
    };

    const handleDeleteCity = async (cityId) => {
        try {
            await axiosPrivate.delete(`/api/city/${cityId}`);
            setCities(cities.filter(city => city._id !== cityId));
        } catch (error) {
            console.error('Failed to delete city:', error);
        }
    };

    return (
        <div style={{padding: '20px'}}>
            <h1>Add New City</h1>
            <CityForm onAddCity={handleAddCity}/>
            <div>
                <h2 style={{marginBottom: '20px'}}>Existing Cities</h2>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
                    {cities.map((city) => (
                        <div key={city._id} style={{
                            position: 'relative',
                            width: '200px',
                            height: '200px',
                            border: '1px solid #ccc',
                            padding: '10px',
                            borderRadius: '5px',
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={() => handleDeleteCity(city._id)}
                                style={{
                                    padding: '5px',
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                X
                            </button>
                            <Link to={`/area/${city._id}`} style={{textDecoration: 'none', color: 'inherit'}}>
                                <div style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    paddingTop: '90px'
                                }}>{city.name}</div>
                                <div style={{textAlign: 'center'}}>Number of Areas: {city.numberOfAreas}</div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CitySelectionPage;