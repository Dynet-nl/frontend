// Apartment list component for appointment scheduling
// Displays a list of apartments with checkboxes for selection

import React from 'react';

interface Apartment {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    flatNumber?: string;
    name?: string;
}

interface FlatAppointment {
    date: string;
    startTime?: string;
    endTime?: string;
    weekNumber?: number;
    type?: string;
    hasMonteurName?: string;
    technischeSchouwerName?: string;
}

interface AppointmentListProps {
    apartments: Apartment[];
    selectedApartments: string[];
    flatAppointments?: Record<string, FlatAppointment>;
    isHASScheduling: boolean;
    onApartmentSelect: (apartmentId: string) => void;
    isSingleApartment?: boolean;
}

const AppointmentList: React.FC<AppointmentListProps> = ({
    apartments,
    selectedApartments,
    flatAppointments = {},
    isHASScheduling,
    onApartmentSelect,
    isSingleApartment = false
}) => {
    /**
     * Get display name for an apartment
     */
    const getApartmentDisplayName = (apartment: Apartment): string => {
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

export default AppointmentList;
