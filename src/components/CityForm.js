import React, { useState } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

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
    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
      <div style={{ marginBottom: '15px' }}>
        <TextField
          id="cityName"
          label="City Name"
          variant="outlined"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
        />
      </div>
      <Button type="submit" variant="contained" style={{ marginTop: '20px', marginBottom: '20px' }}>Add City</Button>
    </form>
  );
};

export default CityForm;
