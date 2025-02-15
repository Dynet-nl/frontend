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

const HASAgendaPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentRange, setCurrentRange] = useState({start: null, end: null});

    useEffect(() => {
        const initialStart = startOfMonth(new Date());
        const initialEnd = endOfMonth(new Date());
        setCurrentRange({start: initialStart, end: initialEnd});
    }, []);

    useEffect(() => {
        if (currentRange.start && currentRange.end) {
            fetchAppointments();
        }
    }, [currentRange]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            console.log('Fetching all HAS Monteur appointments');

            const response = await axiosPrivate.get('/api/apartment/appointments/all-hasmonteur', {
                params: {
                    limit: 100,
                }
            });

            if (response?.data?.length > 0) {
                console.log('HAS Appointments fetched successfully:', response.data);
            } else {
                console.log('No HAS appointments found.');
            }

            const calendarEvents = response.data
                .filter(flat =>
                    flat.hasMonteur?.appointmentBooked?.date &&
                    flat.hasMonteur?.appointmentBooked?.startTime
                )
                .map(flat => {
                    const appointmentData = flat.hasMonteur.appointmentBooked;
                    const appointmentDate = new Date(appointmentData.date);
                    const [startHours, startMinutes] = appointmentData.startTime.split(':');
                    const [endHours, endMinutes] = appointmentData.endTime
                        ? appointmentData.endTime.split(':')
                        : [startHours, startMinutes];

                    const startDateTime = new Date(appointmentDate);
                    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

                    const endDateTime = new Date(appointmentDate);
                    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

                    return {
                        id: flat._id,
                        title: `${appointmentData.type}: ${flat.complexNaam || `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`}`,
                        start: startDateTime,
                        end: endDateTime,
                        resource: {
                            address: `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`,
                            type: appointmentData.type,
                            notes: flat.hasMonteur.notes || 'No notes',
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
        const {resource} = event;
        alert(`
            HAS Appointment Details:
            -----------------------
            Type: ${resource.type}
            Address: ${resource.address}
            Complex Name: ${resource.complexNaam}
            Notes: ${resource.notes}
        `);
    };

    const eventStyleGetter = (event) => {
        const isStoring = event.resource.type === 'Storing';
        return {
            style: {
                backgroundColor: isStoring ? '#e74c3c' : '#2ecc71',
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: `1px solid ${isStoring ? '#c0392b' : '#27ae60'}`,
                display: 'block',
                padding: '5px 10px'
            }
        };
    };

    return (
        <div style={{height: '90vh', padding: '20px', position: 'relative'}}>
            <h1>HAS Monteur Appointments Calendar</h1>
            <div style={{height: 'calc(100% - 60px)'}}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    onSelectEvent={handleEventClick}
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day', 'agenda']}
                    defaultView='month'
                    step={30}
                    timeslots={2}
                    onRangeChange={handleRangeChange}
                    tooltipAccessor={event => `${event.title}\nType: ${event.resource.type}`}
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
                        <BounceLoader color="#2ecc71"/>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HASAgendaPage;