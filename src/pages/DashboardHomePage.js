// Dashboard home page providing main entry point with navigation to city selection. Simple welcome interface for the Fiber Installation Management System.
import React from 'react'
import { useNavigate } from 'react-router-dom'

const DashboardHomePage = () => {
    const navigate = useNavigate();
    
    return (
        <div style={{padding: '20px', textAlign: 'center'}}>
            <h1 style={{marginBottom: '20px'}}>Dynet</h1>
            <img src="/dynetlogo.png" alt="Dynet Logo"
                 style={{margin: '20px auto', display: 'block', maxWidth: '100%', height: 'auto'}}/>
            <p style={{fontSize: '18px'}}>Welcome to the Fiber Installation Management System</p>
            
            <div style={{ marginTop: '40px' }}>
                <button
                    onClick={() => navigate('/city')}
                    style={{
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '15px 30px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        margin: '10px',
                        boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
                    }}
                >
                    🏙️ Select City to Begin
                </button>
            </div>
        </div>
    );
};
export default DashboardHomePage
