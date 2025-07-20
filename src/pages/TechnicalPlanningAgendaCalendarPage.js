import React, {useEffect, useState, useCallback} from 'react';
import {Calendar, dateFnsLocalizer} from 'react-big-calendar';
import {format, parse, startOfWeek, getDay} from 'date-fns';
import {nl} from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import {BounceLoader} from 'react-spinners';

const locales = {
    'nl': nl
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const TechnicalPlanningAgendaCalendarPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const [events, setEvents] = useState([]);
    const [originalEvents, setOriginalEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentRange, setCurrentRange] = useState({start: null, end: null});
    const [technischeSchouwers, setTechnischeSchouwers] = useState([]);
    const [selectedSchouwer, setSelectedSchouwer] = useState('');
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());

    const fetchTechnischeSchouwers = useCallback(async () => {
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
    }, [axiosPrivate]);

    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Fetching all appointments without date filtering.');

            
            const response = await axiosPrivate.get('/api/apartment/appointments/all-technischeplanning', {
                params: {
                    limit: 500,  
                }
            });

            if (response?.data?.length > 0) {
                console.log('Appointments fetched successfully:', response.data);
            } else {
                console.log('No appointments found.');
            }

            
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
                        : [startHours, startMinutes]; 

                    
                    const startDateTime = new Date(appointmentDate);
                    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

                    const endDateTime = new Date(appointmentDate);
                    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

                    return {
                        id: flat._id,
                        title: `Appointment at ${flat.complexNaam || `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`}`,
                        start: startDateTime,
                        end: endDateTime,
                        personName: flat.technischePlanning.technischeSchouwerName, 
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
    }, [axiosPrivate]);

    
    useEffect(() => {
        
        setCurrentRange({start: null, end: null});

        
        fetchTechnischeSchouwers();
        
        
        fetchAppointments();
    }, [fetchTechnischeSchouwers, fetchAppointments]);

    
    
    
    
    
    

    const handleSchouwerFilter = (e) => {
        const selectedName = e.target.value;
        setSelectedSchouwer(selectedName);

        if (!selectedName) {
            
            setEvents(originalEvents);
        } else {
            
            const filteredEvents = originalEvents.filter(event =>
                event.personName === selectedName
            );
            setEvents(filteredEvents);
        }
    };

    const handleRangeChange = (range) => {
        
        
        if (range.start && range.end) {
            setCurrentRange(range);
            setCurrentDisplayMonth(range.start); 
            console.log('Calendar range changed to:', range.start, 'to', range.end);
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

            
            <div style={{
                backgroundColor: '#e8f4fd',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '10px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#1e3a5f',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>💡 <strong>Navigation:</strong> Use "Vorige" and "Volgende" buttons to view appointments from different months</span>
                <span style={{ fontWeight: 'bold' }}>
                    Viewing: {format(currentDisplayMonth, 'MMMM yyyy', { locale: locales.nl })}
                </span>
            </div>

            
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
                    defaultView='month' 
                    step={30}
                    timeslots={2}
                    onRangeChange={handleRangeChange} 
                    showMultiDayTimes={true}
                    popup={true}
                    popupOffset={30}
                    tooltipAccessor={event => `${event.title}\nPhone: ${event.resource.phone}\nSchouwer: ${event.personName}`}
                    messages={{
                        next: "Volgende",
                        previous: "Vorige",
                        today: "Vandaag",
                        month: "Maand",
                        week: "Week",
                        day: "Dag",
                        agenda: "Agenda",
                        noEventsInRange: "Geen afspraken in deze periode",
                        showMore: total => `+ ${total} meer`,
                    }}
                    formats={{
                        monthHeaderFormat: 'MMMM yyyy',
                        dayHeaderFormat: 'dddd, MMMM do',
                        dayRangeHeaderFormat: ({start, end}, culture, localizer) =>
                            localizer.format(start, 'MMMM dd', culture) + ' - ' + 
                            localizer.format(end, 'MMMM dd, yyyy', culture)
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
                        <BounceLoader color="#3498db"/>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechnicalPlanningAgendaCalendarPage;