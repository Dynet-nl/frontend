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
        <form onSubmit={handleSubmit} className="modern-form">
            <div className="modern-form-group">
                <label htmlFor="cityName" className="modern-label">
                    City Name
                </label>
                <input
                    id="cityName"
                    type="text"
                    className="modern-input"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="Enter city name..."
                    required
                    disabled={isSubmitting}
                />
            </div>
            <button 
                type="submit" 
                className="modern-button modern-button-primary"
                disabled={isSubmitting || !cityName.trim()}
            >
                {isSubmitting ? (
                    <>
                        <span className="modern-spinner"></span>
                        Adding City...
                    </>
                ) : (
                    <>
                        <span style={{fontSize: '16px', marginRight: '8px'}}>➕</span>
                        Add City
                    </>
                )}
            </button>
        </form>
    );
};
export default CityForm;
