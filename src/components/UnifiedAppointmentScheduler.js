// Unified appointment scheduler component for both HAS and Technical Planning. Handles multi-apartment selection, date/time picking, and batch appointment saving across different schedule types.

import React, { useState, useEffect } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/unifiedAppointmentScheduler.css';

const UnifiedAppointmentScheduler = ({
    apartments = [],
    scheduleType,
    onSaveSuccess,
    onCancel,
    preselectedApartments = []
}) => {
    const axiosPrivate = useAxiosPrivate();
    const [loading, setLoading] = useState(false);
    const [selectedApartments, setSelectedApartments] = useState(preselectedApartments);
    const [appointmentData, setAppointmentData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        weekNumber: null,
        type: scheduleType === 'HAS' ? 'HAS' : 'Technical',
        hasMonteurName: '',
        technischeSchouwerName: '',
        complaintDetails: ''
    });

    const [availablePersonnel, setAvailablePersonnel] = useState([]);
    const [flatAppointments, setFlatAppointments] = useState({});

    const isMultipleMode = apartments.length > 1;
    const isHASScheduling = scheduleType === 'HAS';
    const isSingleApartment = apartments.length === 1;

    const calculateWeekNumber = (date) => {
        const currentDate = new Date(date);
        const firstJan = new Date(currentDate.getFullYear(), 0, 1);
        const days = Math.floor((currentDate - firstJan) / (24 * 60 * 60 * 1000));
        return Math.ceil((currentDate.getDay() + 1 + days) / 7);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        fetchAvailablePersonnel();
        loadExistingAppointments();
        
        if (isSingleApartment) {
            setSelectedApartments([apartments[0]._id]);
            loadSingleApartmentData();
        } else {
            // For building mode, preselect apartments that have existing appointments
            const apartmentsWithAppointments = apartments.filter(apartment => {
                const appointmentData = isHASScheduling 
                    ? apartment.hasMonteur?.appointmentBooked
                    : apartment.technischePlanning?.appointmentBooked;
                return appointmentData?.date;
            }).map(apartment => apartment._id);
            
            // Combine preselected apartments with apartments that have existing appointments
            const combinedPreselected = [...new Set([...preselectedApartments, ...apartmentsWithAppointments])];
            setSelectedApartments(combinedPreselected);
            
            // If there's exactly one preselected apartment with an appointment, populate the form
            if (combinedPreselected.length === 1) {
                const selectedApartment = apartments.find(apt => apt._id === combinedPreselected[0]);
                if (selectedApartment) {
                    const appointmentData = isHASScheduling 
                        ? selectedApartment.hasMonteur?.appointmentBooked
                        : selectedApartment.technischePlanning?.appointmentBooked;
                    
                    if (appointmentData?.date) {
                        setAppointmentData({
                            date: formatDate(appointmentData.date),
                            startTime: appointmentData.startTime || '',
                            endTime: appointmentData.endTime || '',
                            weekNumber: appointmentData.weekNumber || calculateWeekNumber(appointmentData.date),
                            type: appointmentData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                            hasMonteurName: isHASScheduling ? selectedApartment.hasMonteur?.hasMonteurName || '' : '',
                            technischeSchouwerName: !isHASScheduling ? selectedApartment.technischePlanning?.technischeSchouwerName || '' : '',
                            complaintDetails: appointmentData.complaintDetails || ''
                        });
                    }
                }
            }
        }
    }, [apartments, scheduleType, preselectedApartments, isHASScheduling]);

    const fetchAvailablePersonnel = async () => {
        try {
            const response = await axiosPrivate.get('/api/users');
            const users = response.data;

            let filteredUsers = [];
            if (isHASScheduling) {
                filteredUsers = users.filter(user => 
                    user.roles && typeof user.roles === 'object' && 
                    user.roles.HASMonteur === 2023
                );
            } else {
                filteredUsers = users.filter(user => 
                    user.roles && typeof user.roles === 'object' && 
                    user.roles.TechnischeSchouwer === 8687
                );
            }

            setAvailablePersonnel(filteredUsers);
        } catch (error) {
            console.error('Error fetching personnel:', error);
        }
    };

    const loadExistingAppointments = () => {
        const appointments = {};
        apartments.forEach(apartment => {
            const appointmentData = isHASScheduling 
                ? apartment.hasMonteur?.appointmentBooked
                : apartment.technischePlanning?.appointmentBooked;

            if (appointmentData?.date) {
                appointments[apartment._id] = {
                    date: formatDate(appointmentData.date),
                    startTime: appointmentData.startTime,
                    endTime: appointmentData.endTime,
                    weekNumber: appointmentData.weekNumber,
                    type: appointmentData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                    hasMonteurName: isHASScheduling ? apartment.hasMonteur?.hasMonteurName || '' : '',
                    technischeSchouwerName: !isHASScheduling ? apartment.technischePlanning?.technischeSchouwerName || '' : '',
                    complaintDetails: appointmentData.complaintDetails || ''
                };
            }
        });
        setFlatAppointments(appointments);
    };

    const loadSingleApartmentData = () => {
        if (apartments.length !== 1) return;

        const apartment = apartments[0];
        const appointmentData = isHASScheduling 
            ? apartment.hasMonteur?.appointmentBooked
            : apartment.technischePlanning?.appointmentBooked;

        if (appointmentData && appointmentData.date) {
            setAppointmentData({
                date: formatDate(appointmentData.date),
                startTime: appointmentData.startTime || '',
                endTime: appointmentData.endTime || '',
                weekNumber: appointmentData.weekNumber || calculateWeekNumber(appointmentData.date),
                type: appointmentData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                hasMonteurName: isHASScheduling ? apartment.hasMonteur?.hasMonteurName || '' : '',
                technischeSchouwerName: !isHASScheduling ? apartment.technischePlanning?.technischeSchouwerName || '' : '',
                complaintDetails: appointmentData.complaintDetails || ''
            });
        } else {
            // Set default values if no appointment exists
            const today = new Date().toISOString().split('T')[0];
            setAppointmentData({
                date: today,
                startTime: '',
                endTime: '',
                weekNumber: calculateWeekNumber(today),
                type: isHASScheduling ? 'HAS' : 'Technical',
                hasMonteurName: isHASScheduling ? apartment.hasMonteur?.hasMonteurName || '' : '',
                technischeSchouwerName: !isHASScheduling ? apartment.technischePlanning?.technischeSchouwerName || '' : '',
                complaintDetails: ''
            });
        }
    };

    const handleApartmentSelection = (apartmentId) => {
        if (isSingleApartment) return;

        const newSelectedApartments = selectedApartments.includes(apartmentId) 
            ? selectedApartments.filter(id => id !== apartmentId)
            : [...selectedApartments, apartmentId];
        
        setSelectedApartments(newSelectedApartments);

        // If only one apartment is selected and it has an existing appointment, populate the form
        if (newSelectedApartments.length === 1 && flatAppointments[apartmentId]) {
            const existingAppointment = flatAppointments[apartmentId];
            setAppointmentData({
                date: existingAppointment.date,
                startTime: existingAppointment.startTime,
                endTime: existingAppointment.endTime,
                weekNumber: existingAppointment.weekNumber,
                type: existingAppointment.type,
                hasMonteurName: existingAppointment.hasMonteurName,
                technischeSchouwerName: existingAppointment.technischeSchouwerName,
                complaintDetails: existingAppointment.complaintDetails
            });
        } else if (newSelectedApartments.length !== 1) {
            // Reset to default values when multiple or no apartments are selected
            const today = new Date().toISOString().split('T')[0];
            setAppointmentData({
                date: today,
                startTime: '',
                endTime: '',
                weekNumber: calculateWeekNumber(today),
                type: isHASScheduling ? 'HAS' : 'Technical',
                hasMonteurName: '',
                technischeSchouwerName: '',
                complaintDetails: ''
            });
        }
    };

    const handleAppointmentChange = (e) => {
        const { name, value } = e.target;
        setAppointmentData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'date' ? { weekNumber: calculateWeekNumber(value) } : {})
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedApartments.length === 0) {
            alert('Please select at least one apartment.');
            return;
        }

        setLoading(true);
        try {
            const appointments = await Promise.all(
                selectedApartments.map(async (apartmentId) => {
                    const appointmentPayload = isHASScheduling ? {
                        appointmentBooked: {
                            date: appointmentData.date,
                            startTime: appointmentData.startTime,
                            endTime: appointmentData.endTime,
                            weekNumber: appointmentData.weekNumber,
                            type: appointmentData.type
                        },
                        hasMonteurName: appointmentData.hasMonteurName
                    } : {
                        appointmentBooked: {
                            date: appointmentData.date,
                            startTime: appointmentData.startTime,
                            endTime: appointmentData.endTime,
                            weekNumber: appointmentData.weekNumber
                        },
                        technischeSchouwerName: appointmentData.technischeSchouwerName
                    };

                    if (isHASScheduling && appointmentData.type === 'Complaint' && appointmentData.complaintDetails) {
                        appointmentPayload.appointmentBooked.complaintDetails = appointmentData.complaintDetails;
                    }

                    const endpoint = isHASScheduling 
                        ? `/api/apartment/${apartmentId}/has-monteur`
                        : `/api/apartment/${apartmentId}/technische-planning`;

                    const response = await axiosPrivate.put(endpoint, appointmentPayload);
                    return { apartmentId, data: response.data };
                })
            );

            const updatedAppointments = { ...flatAppointments };
            appointments.forEach(({ apartmentId, data }) => {
                const appointmentData = isHASScheduling 
                    ? data.hasMonteur?.appointmentBooked
                    : data.technischePlanning?.appointmentBooked;

                if (appointmentData) {
                    updatedAppointments[apartmentId] = {
                        date: formatDate(appointmentData.date),
                        startTime: appointmentData.startTime,
                        endTime: appointmentData.endTime,
                        weekNumber: appointmentData.weekNumber,
                        type: appointmentData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                        hasMonteurName: isHASScheduling ? data.hasMonteur?.hasMonteurName || '' : '',
                        technischeSchouwerName: !isHASScheduling ? data.technischePlanning?.technischeSchouwerName || '' : '',
                        complaintDetails: appointmentData.complaintDetails || ''
                    };
                }
            });

            setFlatAppointments(updatedAppointments);
            
            if (onSaveSuccess) {
                onSaveSuccess(appointments);
            }
            
            alert(`${isHASScheduling ? 'HAS' : 'Technical Planning'} appointments saved successfully!`);
        } catch (error) {
            console.error('Error saving appointments:', error);
            alert('Error saving appointments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderApartmentList = () => {
        if (isSingleApartment) {
            const apartment = apartments[0];
            return (
                <div className="usc-singleApartment">
                    <h3>Scheduling for: {apartment.adres} {apartment.huisNummer}{apartment.toevoeging}</h3>
                    {flatAppointments[apartment._id] && (
                        <div className="usc-currentAppointment">
                            <h4>Current Appointment:</h4>
                            <p><strong>Date:</strong> {new Date(flatAppointments[apartment._id].date).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> {flatAppointments[apartment._id].startTime} - {flatAppointments[apartment._id].endTime}</p>
                            <p><strong>Week:</strong> {flatAppointments[apartment._id].weekNumber}</p>
                            {isHASScheduling && (
                                <>
                                    <p><strong>Type:</strong> {flatAppointments[apartment._id].type}</p>
                                    <p><strong>HAS Monteur:</strong> {flatAppointments[apartment._id].hasMonteurName}</p>
                                </>
                            )}
                            {!isHASScheduling && (
                                <p><strong>Technische Schouwer:</strong> {flatAppointments[apartment._id].technischeSchouwerName}</p>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="usc-apartmentList">
                <h3>Select Apartments for {isHASScheduling ? 'HAS' : 'Technical Planning'} Appointment</h3>
                {apartments.map(apartment => (
                    <div key={apartment._id} className="usc-apartmentItem">
                        <label className="usc-apartmentLabel">
                            <input
                                type="checkbox"
                                checked={selectedApartments.includes(apartment._id)}
                                onChange={() => handleApartmentSelection(apartment._id)}
                                className="usc-checkbox"
                            />
                            <span className="usc-apartmentAddress">
                                {apartment.adres} {apartment.huisNummer}{apartment.toevoeging}
                                {flatAppointments[apartment._id] && (
                                    <span className="usc-hasAppointmentIndicator"> (Has existing appointment)</span>
                                )}
                            </span>
                        </label>
                        
                        {flatAppointments[apartment._id] && (
                            <div className="usc-currentAppointment">
                                <h5>Current Appointment:</h5>
                                <p>Date: {new Date(flatAppointments[apartment._id].date).toLocaleDateString()}</p>
                                <p>Time: {flatAppointments[apartment._id].startTime} - {flatAppointments[apartment._id].endTime}</p>
                                <p>Week: {flatAppointments[apartment._id].weekNumber}</p>
                                {isHASScheduling && (
                                    <>
                                        <p>Type: {flatAppointments[apartment._id].type}</p>
                                        <p>HAS Monteur: {flatAppointments[apartment._id].hasMonteurName}</p>
                                    </>
                                )}
                                {!isHASScheduling && (
                                    <p>Technische Schouwer: {flatAppointments[apartment._id].technischeSchouwerName}</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderAppointmentForm = () => (
        <div className="usc-appointmentForm">
            <h3>Set {isHASScheduling ? 'HAS' : 'Technical Planning'} Appointment Details</h3>
            <form onSubmit={handleSubmit}>
                {isHASScheduling && (
                    <div className="usc-formGroup">
                        <label>Appointment Type:</label>
                        <div className="usc-radioGroup">
                            {['HAS', 'Storing', 'Complaint'].map(type => (
                                <label key={type} className="usc-radioLabel">
                                    <input
                                        type="radio"
                                        name="type"
                                        value={type}
                                        checked={appointmentData.type === type}
                                        onChange={handleAppointmentChange}
                                    />
                                    {type}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {isHASScheduling && appointmentData.type === 'Complaint' && (
                    <div className="usc-formGroup">
                        <label>Complaint Details:</label>
                        <textarea
                            name="complaintDetails"
                            value={appointmentData.complaintDetails}
                            onChange={handleAppointmentChange}
                            className="usc-textarea"
                            rows="4"
                            placeholder="Enter complaint details"
                            required={appointmentData.type === 'Complaint'}
                        />
                    </div>
                )}

                <div className="usc-formGroup">
                    <label>Appointment Date:</label>
                    <input
                        type="date"
                        name="date"
                        value={appointmentData.date}
                        onChange={handleAppointmentChange}
                        className="usc-input"
                        required
                    />
                </div>

                <div className="usc-formRow">
                    <div className="usc-formGroup">
                        <label>Start Time:</label>
                        <input
                            type="time"
                            name="startTime"
                            value={appointmentData.startTime}
                            onChange={handleAppointmentChange}
                            className="usc-input"
                            required
                        />
                    </div>
                    <div className="usc-formGroup">
                        <label>End Time:</label>
                        <input
                            type="time"
                            name="endTime"
                            value={appointmentData.endTime}
                            onChange={handleAppointmentChange}
                            className="usc-input"
                            required
                        />
                    </div>
                </div>

                <div className="usc-formGroup">
                    <label>Week Number:</label>
                    <input
                        type="number"
                        name="weekNumber"
                        value={appointmentData.weekNumber || ''}
                        readOnly
                        className="usc-input usc-readonly"
                    />
                </div>

                <div className="usc-formGroup">
                    <label>
                        {isHASScheduling ? 'HAS Monteur:' : 'Technische Schouwer:'}
                    </label>
                    <select
                        name={isHASScheduling ? 'hasMonteurName' : 'technischeSchouwerName'}
                        value={isHASScheduling ? appointmentData.hasMonteurName : appointmentData.technischeSchouwerName}
                        onChange={handleAppointmentChange}
                        className="usc-select"
                        required
                    >
                        <option value="">
                            Select a {isHASScheduling ? 'HAS Monteur' : 'Technische Schouwer'}
                        </option>
                        {availablePersonnel.map(person => (
                            <option key={person._id} value={person.name}>
                                {person.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="usc-buttonGroup">
                    <button
                        type="submit"
                        className="usc-saveButton"
                        disabled={loading || selectedApartments.length === 0}
                    >
                        {loading ? 'Saving...' : 'Save Appointment'}
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="usc-cancelButton"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );

    return (
        <div className="usc-container">
            <div className="usc-columns">
                <div className="usc-leftColumn">
                    {renderApartmentList()}
                </div>
                <div className="usc-rightColumn">
                    {renderAppointmentForm()}
                </div>
            </div>
        </div>
    );
};

export default UnifiedAppointmentScheduler;
