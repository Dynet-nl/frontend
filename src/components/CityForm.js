import React, { useState } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const CityForm = ({ onAddCity }) => {
    const [cityName, setCityName] = useState('');
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await onAddCity({ name: cityName });
        setCityName('');
      } catch (error) {
        console.error('Error adding city:', error);
      }
    };
  
    return (
      <form onSubmit={handleSubmit}>
        <label htmlFor="cityName">City Name:</label>
        <input
          id="cityName"
          type="text"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
        />
        <button type="submit">Add City</button>
      </form>
    );
  };
  

export default CityForm;
