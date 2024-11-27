import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { BounceLoader } from 'react-spinners';

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
    const [loading, setLoading] = useState(false); // Events loading state
    const [currentRange, setCurrentRange] = useState({ start: null, end: null }); // Current calendar view range

    // Set initial range to the current month when component mounts
    useEffect(() => {
        const initialStart = startOfMonth(new Date());
        const initialEnd = endOfMonth(new Date());
        setCurrentRange({ start: initialStart, end: initialEnd });
    }, []);

    useEffect(() => {
        if (currentRange.start && currentRange.end) {
            fetchAppointments(currentRange.start, currentRange.end);
        }
    }, [currentRange]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            console.log('Fetching all appointments without date filtering.');
    
            // Request to fetch all flats that have appointments
            const response = await axiosPrivate.get('/api/apartment/appointments/all', {
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
                        resource: {
                            address: `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`,
                            phone: flat.technischePlanning.telephone || 'Not provided',
                            notes: flat.technischePlanning.additionalNotes || 'No notes',
                            flatId: flat._id,
                            complexNaam: flat.complexNaam || 'N/A'
                        }
                    };
                });
    
            setEvents(calendarEvents);
            console.log('Calendar events created:', calendarEvents);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRangeChange = (range) => {
        if (range.start && range.end) {
            setCurrentRange(range);
        }
    };

    const handleEventClick = (event) => {
        const { resource } = event;
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
        <div style={{ height: '90vh', padding: '20px', position: 'relative' }}>
            <h1>Appointments Calendar</h1>
            <div style={{ height: 'calc(100% - 60px)' }}>
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
                    tooltipAccessor={event => `${event.title}\nPhone: ${event.resource.phone}`}
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
                        <BounceLoader color="#3498db" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgendaPage;
