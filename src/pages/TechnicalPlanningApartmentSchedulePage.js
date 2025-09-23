// Technical planning interface for scheduling apartments with technical appointment options.

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { categorizeBuilding, generateHBNumber } from '../utils/buildingCategorization';
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

    // HB Number generation is now handled by the centralized generateHBNumber function
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
    
    const flats = building.flats || [];
    const hbNumber = generateHBNumber(building, flats);
    const buildingTitle = `${building.address}${hbNumber ? ` (${hbNumber})` : ''}`;
    
    return (
        <div className="ts-apartmentDetailsContainer">
            <h2>Apartment Schedule for {buildingTitle}</h2>
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
                    <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                        border: '2px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                    }}>
                        <h3 style={{
                            color: '#1e293b',
                            fontSize: '24px',
                            fontWeight: '600',
                            margin: '0 0 24px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{fontSize: '24px'}}>📅</span>
                            Schedule Technical Inspection
                        </h3>
                        <form onSubmit={handleAppointmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label 
                                    style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: '#374151',
                                        fontSize: '16px',
                                        fontWeight: '500'
                                    }}
                                >
                                    📅 Inspection Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={appointmentData.date}
                                    onChange={handleAppointmentChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: '#ffffff',
                                        color: '#374151',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
                                <div>
                                    <label 
                                        style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            color: '#374151',
                                            fontSize: '16px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        🕐 Start Time
                                    </label>
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={appointmentData.startTime}
                                        onChange={handleAppointmentChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '16px',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: '#ffffff',
                                            color: '#374151',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#667eea';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e5e7eb';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                                <div>
                                    <label 
                                        style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            color: '#374151',
                                            fontSize: '16px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        🕐 End Time
                                    </label>
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={appointmentData.endTime}
                                        onChange={handleAppointmentChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '16px',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: '#ffffff',
                                            color: '#374151',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#667eea';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e5e7eb';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label 
                                    style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: '#374151',
                                        fontSize: '16px',
                                        fontWeight: '500'
                                    }}
                                >
                                    📊 Week Number (Auto-calculated)
                                </label>
                                <input
                                    type="number"
                                    name="weekNumber"
                                    value={appointmentData.weekNumber || ''}
                                    readOnly
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        fontFamily: 'inherit',
                                        backgroundColor: '#f9fafb',
                                        color: '#6b7280',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label 
                                    style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: '#374151',
                                        fontSize: '16px',
                                        fontWeight: '500'
                                    }}
                                >
                                    👷 Technical Inspector
                                </label>
                                <select
                                    name="technischeSchouwerName"
                                    value={appointmentData.technischeSchouwerName}
                                    onChange={handleAppointmentChange}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: '#ffffff',
                                        color: '#374151',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">Select a Technical Inspector</option>
                                    {technischeSchouwers.map(schouwer => (
                                        <option key={schouwer._id} value={schouwer.name}>
                                            {schouwer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || selectedApartments.length === 0}
                                style={{
                                    background: loading || selectedApartments.length === 0
                                        ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                                        : 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '14px 28px',
                                    borderRadius: '10px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: loading || selectedApartments.length === 0 ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    justifyContent: 'center',
                                    alignSelf: 'flex-start'
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading && selectedApartments.length > 0) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <span style={{fontSize: '18px'}}>
                                    {loading ? '⏳' : '💾'}
                                </span>
                                {loading ? 'Saving Appointment...' : 'Save Appointment'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default TechnicalPlanningApartmentSchedulePage;