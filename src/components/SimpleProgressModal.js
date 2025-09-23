import React, { useState } from 'react';
import '../styles/importProgress.css';

const SimpleProgressModal = ({ isVisible, onClose, progress = 0, message = 'Processing...' }) => {
    if (!isVisible) return null;

    return (
        <div className="progress-modal-overlay">
            <div className="progress-modal-content">
                <div className="progress-header">
                    <h3>🚀 Importing District</h3>
                    <p className="progress-message">{message}</p>
                </div>
                
                <div className="progress-container">
                    <div className="progress-bar-bg">
                        <div 
                            className="progress-bar-fill" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="progress-text">{Math.round(progress)}%</div>
                </div>

                <div className="progress-actions">
                    <button 
                        className="cancel-btn" 
                        onClick={onClose}
                        disabled={progress > 0 && progress < 100}
                    >
                        {progress >= 100 ? 'Close' : 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimpleProgressModal;