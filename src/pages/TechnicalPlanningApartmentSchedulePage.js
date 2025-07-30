// Technical planning interface for scheduling apartments with technical appointment options.

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/tsApartmentDetails.css';
const TechnicalPlanningApartmentSchedulePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();
    const [building, setBuilding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedApartments, setSelectedApartments] = useState([]);
    const [technischeSchouwers, setTechnischeSchouwers] = useState([]);
    const [appointmentData, setAppointmentData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        weekNumber: null,
        technischeSchouwerName: ''
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
    const fetchTechnischeSchouwers = async () => {
        try {
            const response = await axiosPrivate.get('/api/users');
            const users = response.data;
            const schouwers = users.filter(user => {
                return user.roles &&
                    typeof user.roles === 'object' &&
                    user.roles.TechnischeSchouwer === 8687;
            });
            console.log('Found Technische Schouwers:', schouwers);
            setTechnischeSchouwers(schouwers);
        } catch (error) {
            console.error('Error fetching technische schouwers:', error);
        }
    };
    const fetchBuilding = async () => {
        try {
            const { data } = await axiosPrivate.get(`/api/building/${id}`);
            setBuilding(data);
            const initialFlatAppointments = {};
            data.flats.forEach((flat) => {
                if (flat.technischePlanning?.appointmentBooked?.date) {
                    initialFlatAppointments[flat._id] = {
                        date: formatDate(flat.technischePlanning.appointmentBooked.date),
                        startTime: flat.technischePlanning.appointmentBooked.startTime,
                        endTime: flat.technischePlanning.appointmentBooked.endTime,
                        weekNumber: flat.technischePlanning.appointmentBooked.weekNumber,
                        technischeSchouwerName: flat.technischePlanning.technischeSchouwerName || ''
                    };
                }
            });
            setFlatAppointments(initialFlatAppointments);
            const apartmentsWithAppointments = data.flats
                .filter(flat => flat.technischePlanning?.appointmentBooked?.date)
                .map(flat => flat._id);
            setSelectedApartments(apartmentsWithAppointments);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching building data', error);
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchBuilding();
        fetchTechnischeSchouwers(); 
    }, [id, axiosPrivate]);
    const handleApartmentSelection = (flatId) => {
        setSelectedApartments((prevSelected) =>
            prevSelected.includes(flatId)
                ? prevSelected.filter((id) => id !== flatId)
                : [...prevSelected, flatId]
        );
    };
    const handleAppointmentChange = (e) => {
        const { name, value } = e.target;
        setAppointmentData((prevData) => ({
            ...prevData,
            [name]: value,
            ...(name === 'date' ? { weekNumber: calculateWeekNumber(value) } : {})
        }));
    };
    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await Promise.all(
                selectedApartments.map(async (flatId) => {
                    await axiosPrivate.put(`/api/apartment/${flatId}/technische-planning`, {
                        appointmentBooked: {
                            date: appointmentData.date,
                            startTime: appointmentData.startTime,
                            endTime: appointmentData.endTime,
                            weekNumber: appointmentData.weekNumber
                        },
                        technischeSchouwerName: appointmentData.technischeSchouwerName 
                    });
                })
            );
            await fetchBuilding();
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
            <h2>Apartment Schedule for {building.address}</h2>
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
                                            Date: {new Date(flatAppointments[flat._id].date).toLocaleDateString()}
                                        </div>
                                        <div>
                                            Time: {flatAppointments[flat._id].startTime} - {flatAppointments[flat._id].endTime}
                                        </div>
                                        <div>
                                            Week: {flatAppointments[flat._id].weekNumber}
                                        </div>
                                        {flatAppointments[flat._id].technischeSchouwerName && (
                                            <div>
                                                Technische Schouwer: {flatAppointments[flat._id].technischeSchouwerName}
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
                            <label>Technische Schouwer:</label>
                            <select
                                name="technischeSchouwerName"
                                value={appointmentData.technischeSchouwerName}
                                onChange={handleAppointmentChange}
                                className="ts-input"
                            >
                                <option value="">Select a Technische Schouwer</option>
                                {technischeSchouwers.map(schouwer => (
                                    <option key={schouwer._id} value={schouwer.name}>
                                        {schouwer.name}
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
export default TechnicalPlanningApartmentSchedulePage;