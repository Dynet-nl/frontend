// Form component for creating and editing geographical area information.

import React, { useState, FormEvent, ChangeEvent, FocusEvent } from 'react';
import logger from '../utils/logger';

interface AreaData {
    name: string;
    cityId: string;
}

interface AreaFormProps {
    cityId: string;
    onAddArea: (areaData: AreaData) => Promise<void>;
}

const AreaForm: React.FC<AreaFormProps> = ({ cityId, onAddArea }) => {
    const [areaName, setAreaName] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!areaName.trim()) return;
        try {
            setIsSubmitting(true);
            await onAddArea({ name: areaName.trim(), cityId: cityId });
            setAreaName('');
        } catch (error) {
            logger.error('Error adding area:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
                <label
                    htmlFor="areaName"
                    style={{
                        display: 'block',
                        marginBottom: '8px',
                        color: '#374151',
                        fontSize: '16px',
                        fontWeight: '500'
                    }}
                >
                    Area Name
                </label>
                <input
                    id="areaName"
                    type="text"
                    value={areaName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setAreaName(e.target.value)}
                    placeholder="Enter area name..."
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
                    onFocus={(e: FocusEvent<HTMLInputElement>) => {
                        e.target.style.borderColor = '#667eea';
                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e: FocusEvent<HTMLInputElement>) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                    }}
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting || !areaName.trim()}
                style={{
                    background: isSubmitting || !areaName.trim()
                        ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                        : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isSubmitting || !areaName.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                    minWidth: '140px'
                }}
                onMouseEnter={(e) => {
                    if (!isSubmitting && areaName.trim()) {
                        (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                        (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
                    }
                }}
                onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.target as HTMLButtonElement).style.boxShadow = 'none';
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
                        Adding Area...
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: '16px' }}>➕</span>
                        Add Area
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

export default AreaForm;
