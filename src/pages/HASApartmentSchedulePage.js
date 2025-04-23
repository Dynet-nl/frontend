// HASApartmentSchedulePage.jsx
import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/tsApartmentDetails.css'; // Reuse the same styles

const HASApartmentSchedulePage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();

    const [building, setBuilding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedApartments, setSelectedApartments] = useState([]);
    const [hasMonteurs, setHASMonteurs] = useState([]);

    // Moved appointmentData definition to avoid lexical declaration error
    const [appointmentData, setAppointmentData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        weekNumber: null,
        type: 'HAS', // Default appointment type for HASMonteur
        hasMonteurName: '', // Added field for the selected HASMonteur
        complaintDetails: '' // Added field for complaint details
    });

    const [flatAppointments, setFlatAppointments] = useState({});

    const calculateWeekNumber = (date) => {
        const currentDate = new Date(date);
        const startDate = new Date(currentDate.getFullYear(), 0, 1);
        const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil(days / 7);
        return weekNumber;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Fetch users with HASMonteur role (2023)
    const fetchHASMonteurs = async () => {
        try {
            const response = await axiosPrivate.get('/api/users');
            const users = response.data;

            // Filter users with HASMonteur role (2023)
            const monteurs = users.filter(user => {
                return user.roles &&
                    typeof user.roles === 'object' &&
                    user.roles.HASMonteur === 2023;
            });

            console.log('Found HAS Monteurs:', monteurs);
            setHASMonteurs(monteurs);
        } catch (error) {
            console.error('Error fetching HAS Monteurs:', error);
        }
    };

    const fetchBuilding = async () => {
        try {
            const { data } = await axiosPrivate.get(`/api/building/${id}`);
            console.log('Building data:', data);
            setBuilding(data);

            // Initialize appointments from hasMonteur data
            const initialFlatAppointments = {};
            data.flats.forEach((flat) => {
                console.log(`Processing flat ${flat._id}:`, flat.hasMonteur);
                if (flat.hasMonteur?.appointmentBooked?.date) {
                    initialFlatAppointments[flat._id] = {
                        date: formatDate(flat.hasMonteur.appointmentBooked.date),
                        startTime: flat.hasMonteur.appointmentBooked.startTime,
                        endTime: flat.hasMonteur.appointmentBooked.endTime,
                        weekNumber: flat.hasMonteur.appointmentBooked.weekNumber,
                        type: flat.hasMonteur.appointmentBooked.type || 'HAS',
                        hasMonteurName: flat.hasMonteur.hasMonteurName || '',
                        complaintDetails: flat.hasMonteur.appointmentBooked.complaintDetails || ''
                    };
                }
            });

            console.log('Initial flat appointments:', initialFlatAppointments);
            setFlatAppointments(initialFlatAppointments);

            // Select apartments that have appointments
            const apartmentsWithAppointments = data.flats
                .filter(flat => flat.hasMonteur?.appointmentBooked?.date)
                .map(flat => flat._id);

            setSelectedApartments(prevSelected => {
                // Keep existing selections if they're new, otherwise use what's from the server
                const combined = [...new Set([...prevSelected, ...apartmentsWithAppointments])];
                console.log('Selected apartments:', combined);
                return combined;
            });

            setLoading(false);
        } catch (error) {
            console.error('Error fetching building data', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuilding();
        fetchHASMonteurs();
    }, [id, axiosPrivate]);

    const handleApartmentSelection = (flatId) => {
        setSelectedApartments((prevSelected) =>
            prevSelected.includes(flatId)
                ? prevSelected.filter((id) => id !== flatId)
                : [...prevSelected, flatId]
        );
    };

    const handleAppointmentChange = (e) => {
        const {name, value} = e.target;
        setAppointmentData((prevData) => ({
            ...prevData,
            [name]: value,
            // Update week number when date changes
            ...(name === 'date' ? {weekNumber: calculateWeekNumber(value)} : {})
        }));
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create an array to store all appointment results
            const appointmentResults = await Promise.all(
                selectedApartments.map(async (flatId) => {
                    // Create a copy of appointmentData to avoid mutating the state directly
                    const appointmentPayload = {
                        appointmentBooked: {
                            date: appointmentData.date,
                            startTime: appointmentData.startTime,
                            endTime: appointmentData.endTime,
                            weekNumber: appointmentData.weekNumber,
                            type: appointmentData.type
                        },
                        hasMonteurName: appointmentData.hasMonteurName
                    };

                    // Only add complaintDetails if the type is Complaint
                    if (appointmentData.type === 'Complaint' && appointmentData.complaintDetails) {
                        appointmentPayload.appointmentBooked.complaintDetails = appointmentData.complaintDetails;
                    }

                    const response = await axiosPrivate.put(`/api/apartment/${flatId}/has-monteur`, appointmentPayload);
                    return { flatId, data: response.data };
                })
            );

            // Update the local flatAppointments state immediately without waiting for a new fetch
            const updatedFlatAppointments = { ...flatAppointments };

            appointmentResults.forEach(({ flatId, data }) => {
                if (data.hasMonteur?.appointmentBooked) {
                    updatedFlatAppointments[flatId] = {
                        date: formatDate(data.hasMonteur.appointmentBooked.date),
                        startTime: data.hasMonteur.appointmentBooked.startTime,
                        endTime: data.hasMonteur.appointmentBooked.endTime,
                        weekNumber: data.hasMonteur.appointmentBooked.weekNumber,
                        type: data.hasMonteur.appointmentBooked.type || 'HAS',
                        hasMonteurName: data.hasMonteur.hasMonteurName || appointmentData.hasMonteurName,
                        complaintDetails: data.hasMonteur.appointmentBooked.complaintDetails || ''
                    };
                }
            });

            setFlatAppointments(updatedFlatAppointments);

            // Still fetch the full building data to ensure everything is synchronized
            const buildingResponse = await axiosPrivate.get(`/api/building/${id}`);
            setBuilding(buildingResponse.data);

            alert('Appointments saved successfully!');
        } catch (error) {
            console.error('Error saving appointments:', error);
            alert('Error saving appointments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="ts-apartmentDetailsContainer">
            <h2>HAS Appointment Schedule for {building.address}</h2>
            <div className="ts-columns">
                <div className="ts-leftColumn">
                    <h3>Select Apartments for Appointment</h3>
                    {building.flats.map((flat) => (
                        <div key={flat._id} className="ts-apartmentDetails">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedApartments.includes(flat._id)}
                                    onChange={() => handleApartmentSelection(flat._id)}
                                />
                                {flat.adres} {flat.huisNummer}{flat.toevoeging}
                            </label>
                            {selectedApartments.includes(flat._id) && flatAppointments[flat._id] && (
                                <div className="appointmentDetails">
                                    <div className="ts-formGroup">
                                        <label>Current Appointment:</label>
                                        <div>
                                            Type: {flatAppointments[flat._id].type}
                                        </div>
                                        <div>
                                            Date: {new Date(flatAppointments[flat._id].date).toLocaleDateString()}
                                        </div>
                                        <div>
                                            Time: {flatAppointments[flat._id].startTime} - {flatAppointments[flat._id].endTime}
                                        </div>
                                        <div>
                                            Week: {flatAppointments[flat._id].weekNumber}
                                        </div>
                                        {flatAppointments[flat._id].hasMonteurName && (
                                            <div>
                                                HAS Monteur: {flatAppointments[flat._id].hasMonteurName}
                                            </div>
                                        )}
                                        {flatAppointments[flat._id].type === 'Complaint' && flatAppointments[flat._id].complaintDetails && (
                                            <div>
                                                Complaint Details: {flatAppointments[flat._id].complaintDetails}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="ts-rightColumn">
                    <h3>Set Appointment Details</h3>
                    <form onSubmit={handleAppointmentSubmit} className="ts-form">
                        <div className="ts-formGroup">
                            <label>Appointment Type:</label>
                            <div className="ts-radioGroup">
                                <label>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="HAS"
                                        checked={appointmentData.type === 'HAS'}
                                        onChange={handleAppointmentChange}
                                    />
                                    HAS
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="Storing"
                                        checked={appointmentData.type === 'Storing'}
                                        onChange={handleAppointmentChange}
                                    />
                                    Storing
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="Complaint"
                                        checked={appointmentData.type === 'Complaint'}
                                        onChange={handleAppointmentChange}
                                    />
                                    Complaint
                                </label>
                            </div>
                        </div>
                        {appointmentData.type === 'Complaint' && (
                            <div className="ts-formGroup">
                                <label>Complaint Details:</label>
                                <textarea
                                    name="complaintDetails"
                                    value={appointmentData.complaintDetails}
                                    onChange={handleAppointmentChange}
                                    className="ts-input"
                                    rows="4"
                                    placeholder="Enter complaint details"
                                    required={appointmentData.type === 'Complaint'}
                                ></textarea>
                            </div>
                        )}
                        <div className="ts-formGroup">
                            <label>Appointment Date:</label>
                            <input
                                type="date"
                                name="date"
                                value={appointmentData.date}
                                onChange={handleAppointmentChange}
                                className="ts-input"
                                required
                            />
                        </div>
                        <div className="ts-formGroup">
                            <label>Start Time:</label>
                            <input
                                type="time"
                                name="startTime"
                                value={appointmentData.startTime}
                                onChange={handleAppointmentChange}
                                className="ts-input"
                                required
                            />
                        </div>
                        <div className="ts-formGroup">
                            <label>End Time:</label>
                            <input
                                type="time"
                                name="endTime"
                                value={appointmentData.endTime}
                                onChange={handleAppointmentChange}
                                className="ts-input"
                                required
                            />
                        </div>
                        <div className="ts-formGroup">
                            <label>Week Number:</label>
                            <input
                                type="number"
                                name="weekNumber"
                                value={appointmentData.weekNumber || ''}
                                readOnly
                                className="ts-input"
                            />
                        </div>
                        <div className="ts-formGroup">
                            <label>HAS Monteur:</label>
                            <select
                                name="hasMonteurName"
                                value={appointmentData.hasMonteurName}
                                onChange={handleAppointmentChange}
                                className="ts-input"
                            >
                                <option value="">Select a HAS Monteur</option>
                                {hasMonteurs.map(monteur => (
                                    <option key={monteur._id} value={monteur.name}>
                                        {monteur.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="ts-saveButton"
                            disabled={loading || selectedApartments.length === 0}
                        >
                            {loading ? 'Saving...' : 'Save Appointment'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default HASApartmentSchedulePage;