import React, {useState} from 'react';

const AreaForm = ({cityId, onAddArea}) => {
    const [areaName, setAreaName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!areaName.trim()) return;
        
        try {
            setIsSubmitting(true);
            await onAddArea({name: areaName.trim(), cityId: cityId});
            setAreaName('');
        } catch (error) {
            console.error('Error adding area:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="modern-form">
            <div className="modern-form-group">
                <label htmlFor="areaName" className="modern-label">
                    Area Name
                </label>
                <input
                    id="areaName"
                    type="text"
                    className="modern-input"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    placeholder="Enter area name..."
                    required
                    disabled={isSubmitting}
                />
            </div>
            <button 
                type="submit" 
                className="modern-button modern-button-primary"
                disabled={isSubmitting || !areaName.trim()}
            >
                {isSubmitting ? (
                    <>
                        <span className="modern-spinner"></span>
                        Adding Area...
                    </>
                ) : (
                    <>
                        <span style={{fontSize: '16px', marginRight: '8px'}}>➕</span>
                        Add Area
                    </>
                )}
            </button>
        </form>
    );
};

export default AreaForm;
