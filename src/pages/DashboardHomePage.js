// Dashboard home page providing main entry point with navigation to city selection. Modern welcome interface for the Fiber Installation Management System.
import React from 'react'
import { useNavigate } from 'react-router-dom'

const DashboardHomePage = () => {
    const navigate = useNavigate();
    
    return (
        <div className="modern-card" style={{margin: '40px auto', maxWidth: '800px'}}>
            <div className="modern-card-header" style={{textAlign: 'center', position: 'relative'}}>
                {/* Modern decorative line */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #3498db, #2980b9, #3498db)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s ease-in-out infinite'
                }}></div>
                
                <h1 className="modern-title" style={{fontSize: '2.5rem', marginBottom: '16px'}}>
                    Dynet
                </h1>
                <p className="modern-subtitle" style={{fontSize: '1.2rem'}}>
                    Fiber Installation Management System
                </p>
            </div>
            
            <div className="modern-card-body" style={{textAlign: 'center', padding: '48px 24px'}}>
                <div style={{marginBottom: '40px'}}>
                    <img 
                        src="/dynetLogo.png" 
                        alt="Dynet Logo"
                        style={{
                            maxWidth: '120px',
                            height: 'auto',
                            margin: '0 auto',
                            display: 'block',
                            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                            borderRadius: '12px'
                        }}
                    />
                </div>
                
                <div style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    padding: '32px',
                    borderRadius: '12px',
                    marginBottom: '32px',
                    border: '1px solid #e9ecef'
                }}>
                    <h2 className="modern-title" style={{fontSize: '1.5rem', marginBottom: '12px'}}>
                        Welcome to Your Workspace
                    </h2>
                    <p className="modern-text" style={{fontSize: '16px', lineHeight: '1.6'}}>
                        Streamline your fiber installation projects with our comprehensive management platform. 
                        From planning to completion, manage every aspect of your fiber network deployment.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px'
                }}>
                    <div className="status-indicator completed" style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: '#e8f5e8',
                        border: '2px solid #27ae60'
                    }}>
                        <div style={{fontSize: '24px', marginBottom: '8px'}}>🏗️</div>
                        <strong>Project Management</strong>
                        <br />
                        <small>Plan and track installations</small>
                    </div>
                    
                    <div className="status-indicator scheduled" style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: '#e8f4fd',
                        border: '2px solid #3498db'
                    }}>
                        <div style={{fontSize: '24px', marginBottom: '8px'}}>📅</div>
                        <strong>Scheduling</strong>
                        <br />
                        <small>Coordinate appointments</small>
                    </div>
                    
                    <div className="status-indicator pending" style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: '#fff8e1',
                        border: '2px solid #f39c12'
                    }}>
                        <div style={{fontSize: '24px', marginBottom: '8px'}}>🔧</div>
                        <strong>Technical Planning</strong>
                        <br />
                        <small>Engineering oversight</small>
                    </div>
                </div>
                
                <button
                    onClick={() => navigate('/city')}
                    className="modern-button modern-button-primary"
                    style={{
                        fontSize: '18px',
                        padding: '16px 32px',
                        borderRadius: '12px',
                        minWidth: '200px'
                    }}
                >
                    <span style={{fontSize: '20px', marginRight: '8px'}}>🏙️</span>
                    Select City to Begin
                </button>
            </div>
            
            <div className="modern-card-footer" style={{textAlign: 'center'}}>
                <p className="modern-text-muted" style={{fontSize: '14px', margin: 0}}>
                    🔒 Secure • Efficient • Professional
                </p>
            </div>
        </div>
    );
};
export default DashboardHomePage
