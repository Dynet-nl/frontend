// Admin interface for choosing between technical planning and HAS planning scheduling options.

import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/AdminSchedulingSelection.css';
const AdminSchedulingSelectionPage = () => {
    const { id } = useParams(); // building ID
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'building';
    const handleTechnicalPlanningSelect = () => {
        navigate(`/appointment-scheduler/${id}?mode=${mode}&type=Technical`);
    };
    const handleHASPlanningSelect = () => {
        navigate(`/has-appointment-scheduler/${id}?mode=${mode}&type=HAS`);
    };
    const handleGoBack = () => {
        navigate(-1);
    };
    return (
        <div className="admin-scheduling-selection">
            <div className="selection-container">
                <div className="selection-header">
                    <h1>Select Scheduling Type</h1>
                    <p>As an admin, choose which scheduling interface you'd like to use:</p>
                </div>
                <div className="selection-options">
                    <div className="scheduling-option technical-option" onClick={handleTechnicalPlanningSelect}>
                        <div className="option-icon">
                            <i className="fas fa-tools"></i>
                        </div>
                        <div className="option-content">
                            <h3>Technical Planning</h3>
                            <p>Schedule technical appointments and inspections</p>
                            <ul>
                                <li>Technical installations</li>
                                <li>Equipment inspections</li>
                                <li>Maintenance scheduling</li>
                            </ul>
                        </div>
                        <div className="option-arrow">
                            <i className="fas fa-chevron-right"></i>
                        </div>
                    </div>
                    <div className="scheduling-option has-option" onClick={handleHASPlanningSelect}>
                        <div className="option-icon">
                            <i className="fas fa-home"></i>
                        </div>
                        <div className="option-content">
                            <h3>HAS Planning</h3>
                            <p>Schedule HAS-related appointments and services</p>
                            <ul>
                                <li>HAS installations</li>
                                <li>Service appointments</li>
                                <li>Customer meetings</li>
                            </ul>
                        </div>
                        <div className="option-arrow">
                            <i className="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>
                <div className="selection-actions">
                    <button className="btn-secondary" onClick={handleGoBack}>
                        <i className="fas fa-arrow-left"></i>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};
export default AdminSchedulingSelectionPage;
