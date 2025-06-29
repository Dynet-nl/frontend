import React, {useEffect, useState} from 'react';
import {Calendar, dateFnsLocalizer} from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import {BounceLoader} from 'react-spinners';

const locales = {
    'nl': require('date-fns/locale/nl')
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const AgendaPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const [events, setEvents] = useState([]); // Events state
    const [originalEvents, setOriginalEvents] = useState([]); // Original events for filtering
    const [loading, setLoading] = useState(false); // Events loading state
    const [currentRange, setCurrentRange] = useState({start: null, end: null}); // Current calendar view range
    const [technischeSchouwers, setTechnischeSchouwers] = useState([]); // List of Technische Schouwers
    const [selectedSchouwer, setSelectedSchouwer] = useState(''); // Selected Schouwer for filtering

    // Fetch Technische Schouwers with specific role code
    const fetchTechnischeSchouwers = async () => {
        try {
            const response = await axiosPrivate.get('/api/users');
            const users = response.data;

            // Filter users with TechnischeSchouwer role (8687)
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

    // Set initial range to the current month when component mounts
    useEffect(() => {
        const initialStart = startOfMonth(new Date());
        const initialEnd = endOfMonth(new Date());
        setCurrentRange({start: initialStart, end: initialEnd});

        // Fetch Technische Schouwers
        fetchTechnischeSchouwers();
    }, []);

    useEffect(() => {
        if (currentRange.start && currentRange.end) {
            fetchAppointments();
        }
    }, [currentRange]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            console.log('Fetching all appointments without date filtering.');

            // Request to fetch all flats that have appointments
            const response = await axiosPrivate.get('/api/apartment/appointments/all-technischeplanning', {
                params: {
                    limit: 100,  // Limit the number of fetched flats to reduce load
                }
            });

            if (response?.data?.length > 0) {
                console.log('Appointments fetched successfully:', response.data);
            } else {
                console.log('No appointments found.');
            }

            // Create calendar events from fetched appointments
            const calendarEvents = response.data
                .filter(flat =>
                    flat.technischePlanning?.appointmentBooked?.date &&
                    flat.technischePlanning?.appointmentBooked?.startTime
                )
                .map(flat => {
                    const appointmentDate = new Date(flat.technischePlanning.appointmentBooked.date);
                    const [startHours, startMinutes] = flat.technischePlanning.appointmentBooked.startTime.split(':');
                    const [endHours, endMinutes] = flat.technischePlanning.appointmentBooked.endTime
                        ? flat.technischePlanning.appointmentBooked.endTime.split(':')
                        : [startHours, startMinutes]; // Fallback to start time if end time is not provided

                    // Set start and end time for the appointment date
                    const startDateTime = new Date(appointmentDate);
                    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

                    const endDateTime = new Date(appointmentDate);
                    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

                    return {
                        id: flat._id,
                        title: `Appointment at ${flat.complexNaam || `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`}`,
                        start: startDateTime,
                        end: endDateTime,
                        personName: flat.technischeSchouwer.name, // Add person name for filtering
                        resource: {
                            address: `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`,
                            phone: flat.technischePlanning.telephone || 'Not provided',
                            notes: flat.technischePlanning.additionalNotes || 'No notes',
                            flatId: flat._id,
                            complexNaam: flat.complexNaam || 'N/A'
                        }
                    };
                });

            setOriginalEvents(calendarEvents);
            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSchouwerFilter = (e) => {
        const selectedName = e.target.value;
        setSelectedSchouwer(selectedName);

        if (!selectedName) {
            // If no user is selected, show all events
            setEvents(originalEvents);
        } else {
            // Filter events by selected Technische Schouwer
            const filteredEvents = originalEvents.filter(event =>
                event.personName === selectedName
            );
            setEvents(filteredEvents);
        }
    };

    const handleRangeChange = (range) => {
        if (range.start && range.end) {
            setCurrentRange(range);
        }
    };

    const handleEventClick = (event) => {
        const {resource} = event;
        alert(`
            Appointment Details:
            -------------------
            Address: ${resource.address}
            Phone: ${resource.phone}
            Notes: ${resource.notes}
            Complex Name: ${resource.complexNaam}
        `);
    };

    const eventStyleGetter = (event) => {
        return {
            style: {
                backgroundColor: '#3498db',
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: '1px solid #2980b9',
                display: 'block',
                padding: '5px 10px'
            }
        };
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: '20px'
        }}>
            {/* Filter Section - Explicitly at the top */}
            <div style={{
                width: '100%',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f0f0f0',
                padding: '15px',
                borderRadius: '8px'
            }}>
                {technischeSchouwers.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <label htmlFor="schouwerFilter" style={{
                            marginRight: '10px',
                            fontWeight: 'bold'
                        }}>
                            Select Technische Schouwer:
                        </label>
                        <select
                            id="schouwerFilter"
                            value={selectedSchouwer}
                            onChange={handleSchouwerFilter}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                minWidth: '250px'
                            }}
                        >
                            <option value="">All Technische Schouwers</option>
                            {technischeSchouwers.map(schouwer => (
                                <option key={schouwer._id} value={schouwer.name}>
                                    {schouwer.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Calendar Section - Takes remaining space */}
            <div style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    onSelectEvent={handleEventClick}
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day', 'agenda']}
                    defaultView='month' // Set to 'month' to load all appointments for the month initially
                    step={30}
                    timeslots={2}
                    onRangeChange={handleRangeChange} // Fetch appointments based on the visible range
                    tooltipAccessor={event => `${event.title}\nPhone: ${event.resource.phone}\nSchouwer: ${event.personName}`}
                    messages={{
                        next: "Volgende",
                        previous: "Vorige",
                        today: "Vandaag",
                        month: "Maand",
                        week: "Week",
                        day: "Dag",
                        agenda: "Agenda",
                    }}
                />
                {/* Show loader over the calendar while fetching events */}
                {loading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <BounceLoader color="#3498db"/>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgendaPage;