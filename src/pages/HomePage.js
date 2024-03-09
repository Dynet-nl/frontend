import React from 'react'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '20px' }}>Dynet</h1>
      <img src="/dynetlogo.png" alt="Dynet Logo" style={{ margin: '20px auto', display: 'block', maxWidth: '100%', height: 'auto' }} />
      <p style={{ fontSize: '18px' }}>You are logged in!</p>
    </div>
  );
};


export default HomePage
