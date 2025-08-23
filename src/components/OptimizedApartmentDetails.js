// Optimized apartment details component showing the most important information for Admin, TechnischePlanning, and HASPlanning roles.

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import ROLES_LIST from '../context/roles_list';
import { getStatusColor, getStatusText } from '../utils/statusUtils';
import '../styles/optimizedApartmentDetails.css';

const OptimizedApartmentDetails = () => {
    const params = useParams();
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const [apartment, setApartment] = useState(null);
    const [loading, setLoading] = useState(true);

    // Role checking
    const isAdmin = auth?.roles?.includes(ROLES_LIST.Admin);
    const isTechnischePlanning = auth?.roles?.includes(ROLES_LIST.TechnischePlanning);
    const isHASPlanning = auth?.roles?.includes(ROLES_LIST.HASPlanning);

    useEffect(() => {
        const fetchApartment = async () => {
            try {
                const { data } = await axiosPrivate.get(`/api/apartment/${params.id}`);
                setApartment(data);
            } catch (error) {
                console.error("Failed to fetch apartment details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApartment();
    }, [axiosPrivate, params.id]);

    if (loading) {
        return (
            <div className="optimized-apartment-loading">
                <div className="loading-spinner"></div>
                <p>Loading apartment details...</p>
            </div>
        );
    }

    if (!apartment) {
        return (
            <div className="optimized-apartment-error">
                <p>Apartment not found</p>
            </div>
        );
    }

    // Status indicators - now using centralized utility functions
    const hasAppointment = apartment.technischePlanning?.appointmentBooked?.date || apartment.hasMonteur?.appointmentBooked?.date;
    const appointmentType = apartment.technischePlanning?.appointmentBooked?.date ? 'Technical' : 
                           apartment.hasMonteur?.appointmentBooked?.date ? 'HAS' : null;

    return (
        <div className="optimized-apartment-container">
            {/* Header Section */}
            <div className="apartment-header">
                <div className="apartment-title">
                    <h1>{apartment.complexNaam || `${apartment.adres} ${apartment.huisNummer}${apartment.toevoeging}`}</h1>
                    <div className="apartment-subtitle">
                        <span className="building-type">{apartment.soortBouw}</span>
                        <span className="zoeksleutel">{apartment.zoeksleutel}</span>
                    </div>
                </div>
                <div className="status-indicator">
                    <div 
                        className="status-circle"
                        style={{ backgroundColor: getStatusColor(apartment.fcStatusHas) }}
                        title={`Status: ${getStatusText(apartment.fcStatusHas)}`}
                    >
                        {getStatusText(apartment.fcStatusHas)}
                    </div>
                </div>
            </div>

            {/* Quick Status Overview */}
            <div className="status-overview">
                <div className="status-grid">
                    <div className="status-item">
                        <span className="status-label">Technical Planning</span>
                        <span className={`status-value ${apartment.technischePlanning ? 'active' : 'inactive'}`}>
                            {apartment.technischePlanning ? '✓' : '○'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">HAS Planning</span>
                        <span className={`status-value ${apartment.hasMonteur ? 'active' : 'inactive'}`}>
                            {apartment.hasMonteur ? '✓' : '○'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Appointment</span>
                        <span className={`status-value ${hasAppointment ? 'active' : 'inactive'}`}>
                            {hasAppointment ? `✓ ${appointmentType}` : '○'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Signed</span>
                        <span className={`status-value ${apartment.technischePlanning?.signed ? 'active' : 'inactive'}`}>
                            {apartment.technischePlanning?.signed ? '✓' : '○'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Information Grid */}
            <div className="info-grid">
                {/* Essential Information */}
                <div className="info-section">
                    <h3>Location & Contact</h3>
                    <div className="info-content">
                        <div className="info-row">
                            <span className="info-label">Address:</span>
                            <span className="info-value">{apartment.adres} {apartment.huisNummer}{apartment.toevoeging}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Postcode:</span>
                            <span className="info-value">{apartment.postcode}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Resident:</span>
                            <span className="info-value">{apartment.achternaam}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Phone:</span>
                            <span className="info-value">{apartment.tel1 || apartment.tel2 || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{apartment.eMail || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Technical Information */}
                <div className="info-section">
                    <h3>Technical Details</h3>
                    <div className="info-content">
                        <div className="info-row">
                            <span className="info-label">Team:</span>
                            <span className="info-value">{apartment.team || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">IP Vezel Value:</span>
                            <span className="info-value">{apartment.ipVezelwaarde || apartment.IPVezelwaarde || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">ODF:</span>
                            <span className="info-value">{apartment.odf || apartment.ODF || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">ODF Position:</span>
                            <span className="info-value">{apartment.odfPositie || apartment.ODFPositie || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Civil Status:</span>
                            <span className="info-value">{apartment.civielStatus || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Planning Information - Show based on role */}
                {(isAdmin || isTechnischePlanning) && apartment.technischePlanning && (
                    <div className="info-section">
                        <h3>Technical Planning</h3>
                        <div className="info-content">
                            <div className="info-row">
                                <span className="info-label">VVE/WoCo:</span>
                                <span className="info-value">{apartment.technischePlanning.vveWocoName || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Inspector:</span>
                                <span className="info-value">{apartment.technischePlanning.technischeSchouwerName || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Ready for Inspector:</span>
                                <span className={`info-value ${apartment.technischePlanning.readyForSchouwer ? 'positive' : 'negative'}`}>
                                    {apartment.technischePlanning.readyForSchouwer ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Times Called:</span>
                                <span className="info-value">{apartment.technischePlanning.timesCalled || 0}</span>
                            </div>
                            {apartment.technischePlanning.appointmentBooked?.date && (
                                <div className="info-row">
                                    <span className="info-label">Appointment:</span>
                                    <span className="info-value">
                                        {new Date(apartment.technischePlanning.appointmentBooked.date).toLocaleDateString()} 
                                        {apartment.technischePlanning.appointmentBooked.startTime && 
                                         ` ${apartment.technischePlanning.appointmentBooked.startTime}`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* HAS Planning Information */}
                {(isAdmin || isHASPlanning) && apartment.hasMonteur && (
                    <div className="info-section">
                        <h3>HAS Planning</h3>
                        <div className="info-content">
                            <div className="info-row">
                                <span className="info-label">HAS Monteur:</span>
                                <span className="info-value">{apartment.hasMonteur.hasMonteurName || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Installation Status:</span>
                                <span className="info-value">{apartment.hasMonteur.installation?.status || 'N/A'}</span>
                            </div>
                            {apartment.hasMonteur.appointmentBooked?.date && (
                                <div className="info-row">
                                    <span className="info-label">HAS Appointment:</span>
                                    <span className="info-value">
                                        {new Date(apartment.hasMonteur.appointmentBooked.date).toLocaleDateString()}
                                        {apartment.hasMonteur.appointmentBooked.startTime && 
                                         ` ${apartment.hasMonteur.appointmentBooked.startTime}`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Notes Section */}
                {(apartment.technischePlanning?.additionalNotes || apartment.toelichtingStatus) && (
                    <div className="info-section full-width">
                        <h3>Notes & Comments</h3>
                        <div className="info-content">
                            {apartment.technischePlanning?.additionalNotes && (
                                <div className="info-row">
                                    <span className="info-label">Technical Notes:</span>
                                    <span className="info-value">{apartment.technischePlanning.additionalNotes}</span>
                                </div>
                            )}
                            {apartment.toelichtingStatus && (
                                <div className="info-row">
                                    <span className="info-label">Status Notes:</span>
                                    <span className="info-value">{apartment.toelichtingStatus}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Admin-only Additional Information */}
            {isAdmin && (
                <details className="admin-details">
                    <summary>Advanced Information (Admin Only)</summary>
                    <div className="admin-info-grid">
                        <div className="info-row">
                            <span className="info-label">Created:</span>
                            <span className="info-value">{new Date(apartment.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Updated:</span>
                            <span className="info-value">{new Date(apartment.updatedAt).toLocaleString()}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Toestemming:</span>
                            <span className="info-value">{apartment.toestemming || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Type NT:</span>
                            <span className="info-value">{apartment.typeNT || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">AP:</span>
                            <span className="info-value">{apartment.ap || apartment.AP || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">DP:</span>
                            <span className="info-value">{apartment.dp || apartment.DP || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Laswerk AP:</span>
                            <span className="info-value">{apartment.laswerkAP || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Laswerk DP:</span>
                            <span className="info-value">{apartment.laswerkDP || 'N/A'}</span>
                        </div>
                    </div>
                </details>
            )}
        </div>
    );
};

export default OptimizedApartmentDetails;
