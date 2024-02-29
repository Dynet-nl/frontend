import React, { useEffect, useState } from 'react';
import CityForm from '../components/CityForm';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const CitiesPage = () => {
    const [cities, setCities] = useState([]);
    const axiosPrivate = useAxiosPrivate();
  
    // Function to fetch existing cities from the backend
    const fetchCities = async () => {
      try {
        const response = await axiosPrivate.get('/api/city');
        setCities(response.data); // Update state with fetched cities
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      }
    };
  
    // Fetch cities when the component mounts or axiosPrivate changes
    useEffect(() => {
        fetchCities();
        }, [axiosPrivate]);
  
    const handleAddCity = async (newCity) => {
      try {
        const response = await axiosPrivate.post('/api/city', newCity);
        const addedCity = response.data; // Newly added city from the backend
  
        console.log("Added city ", addedCity);
        // Update the cities state to include the new city
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
        <div>
          <h1>Add New City</h1>
          <CityForm onAddCity={handleAddCity} />
          <div>
            <h2>Existing Cities</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {cities.map((city) => (
                <div key={city._id} style={{ position: 'relative', width: '200px', height: '200px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                  <button
                    onClick={() => handleDeleteCity(city._id)}
                    style={{ position: 'absolute', top: '5px', right: '5px', cursor: 'pointer' }}
                  >
                    X
                  </button>
                  <div style={{ fontWeight: 'bold', textAlign: 'center', paddingTop: '90px' }}>{city.name}</div>
                  <div style={{ textAlign: 'center' }}>Number of Districts: {city.districts.length}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

export default CitiesPage;