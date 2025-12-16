import React from 'react';
import PropTypes from 'prop-types';

/**
 * Apartment list component for appointment scheduling
 * Displays a list of apartments with checkboxes for selection
 */
const AppointmentList = ({
    apartments,
    selectedApartments,
    flatAppointments,
    isHASScheduling,
    onApartmentSelect,
    isSingleApartment
}) => {
    /**
     * Get display name for an apartment
     */
    const getApartmentDisplayName = (apartment) => {
        if (apartment.adres) {
            return `${apartment.adres} ${apartment.huisNummer || ''}${apartment.toevoeging || ''}`;
        }
        return apartment.flatNumber || apartment.name || `Apartment ${apartment._id.slice(-4)}`;
    };

    /**
     * Render single apartment view
     */
    if (isSingleApartment && apartments.length === 1) {
        const apartment = apartments[0];
        const existingAppointment = flatAppointments[apartment._id];
        
        return (
            <div className="usc-singleApartment">
                <h3>Scheduling for: {getApartmentDisplayName(apartment)}</h3>
                {existingAppointment && (
                    <div className="usc-currentAppointment">
                        <h4>Current Appointment:</h4>
                        <p><strong>Date:</strong> {new Date(existingAppointment.date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {existingAppointment.startTime} - {existingAppointment.endTime}</p>
                        <p><strong>Week:</strong> {existingAppointment.weekNumber}</p>
                        {isHASScheduling && (
                            <>
                                <p><strong>Type:</strong> {existingAppointment.type}</p>
                                <p><strong>HAS Monteur:</strong> {existingAppointment.hasMonteurName}</p>
                            </>
                        )}
                        {!isHASScheduling && (
                            <p><strong>Technische Schouwer:</strong> {existingAppointment.technischeSchouwerName}</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    /**
     * Render multi-apartment selection list
     */
    return (
        <div className="usc-apartmentList">
            <h3>Select Apartments for {isHASScheduling ? 'HAS' : 'Technical Planning'} Appointment</h3>
            {apartments.map(apartment => {
                const isSelected = selectedApartments.includes(apartment._id);
                const existingAppointment = flatAppointments[apartment._id];
                
                return (
                    <div key={apartment._id} className="usc-apartmentItem">
                        <label className="usc-apartmentLabel">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onApartmentSelect(apartment._id)}
                                className="usc-checkbox"
                            />
                            <span className="usc-apartmentAddress">
                                {getApartmentDisplayName(apartment)}
                                {existingAppointment && (
                                    <span className="usc-hasAppointmentIndicator"> (Has existing appointment)</span>
                                )}
                            </span>
                        </label>
                        {existingAppointment && (
                            <div className="usc-existingAppointmentDetails">
                                <p>Date: {new Date(existingAppointment.date).toLocaleDateString()}</p>
                                <p>Time: {existingAppointment.startTime} - {existingAppointment.endTime}</p>
                                <p>Week: {existingAppointment.weekNumber}</p>
                                {isHASScheduling && (
                                    <>
                                        <p>Type: {existingAppointment.type}</p>
                                        <p>HAS Monteur: {existingAppointment.hasMonteurName}</p>
                                    </>
                                )}
                                {!isHASScheduling && (
                                    <p>Technische Schouwer: {existingAppointment.technischeSchouwerName}</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

AppointmentList.propTypes = {
    apartments: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
        adres: PropTypes.string,
        huisNummer: PropTypes.string,
        toevoeging: PropTypes.string,
        flatNumber: PropTypes.string,
        name: PropTypes.string
    })).isRequired,
    selectedApartments: PropTypes.arrayOf(PropTypes.string).isRequired,
    flatAppointments: PropTypes.object,
    isHASScheduling: PropTypes.bool.isRequired,
    onApartmentSelect: PropTypes.func.isRequired,
    isSingleApartment: PropTypes.bool
};

AppointmentList.defaultProps = {
    flatAppointments: {},
    isSingleApartment: false
};

export default AppointmentList;
