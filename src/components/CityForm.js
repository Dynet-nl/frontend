// Form component for creating and editing city information.

import React, {useState} from 'react';
const CityForm = ({onAddCity}) => {
    const [cityName, setCityName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!cityName.trim()) return;
        try {
            setIsSubmitting(true);
            await onAddCity({name: cityName.trim()});
            setCityName('');
        } catch (error) {
            console.error('Error adding city:', error);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
                <label 
                    htmlFor="cityName" 
                    style={{
                        display: 'block',
                        marginBottom: '8px',
                        color: '#374151',
                        fontSize: '16px',
                        fontWeight: '500'
                    }}
                >
                    City Name
                </label>
                <input
                    id="cityName"
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="Enter city name..."
                    required
                    disabled={isSubmitting}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                        backgroundColor: isSubmitting ? '#f9fafb' : '#ffffff',
                        color: '#374151',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#667eea';
                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                    }}
                />
            </div>
            <button 
                type="submit" 
                disabled={isSubmitting || !cityName.trim()}
                style={{
                    background: isSubmitting || !cityName.trim() 
                        ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                        : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isSubmitting || !cityName.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                    minWidth: '140px'
                }}
                onMouseEnter={(e) => {
                    if (!isSubmitting && cityName.trim()) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                }}
            >
                {isSubmitting ? (
                    <>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #ffffff',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        Adding City...
                    </>
                ) : (
                    <>
                        <span style={{fontSize: '16px'}}>➕</span>
                        Add City
                    </>
                )}
            </button>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </form>
    );
};
export default CityForm;
