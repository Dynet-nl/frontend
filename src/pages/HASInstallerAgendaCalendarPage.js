import React, {useEffect, useState, useCallback} from 'react';
import {Calendar, dateFnsLocalizer} from 'react-big-calendar';
import {format, parse, startOfWeek, getDay} from 'date-fns';
import {nl} from 'date-fns/locale';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import {BounceLoader} from 'react-spinners';
import {useNavigate} from 'react-router-dom';

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

const HASInstallerAgendaCalendarPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [originalEvents, setOriginalEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentRange, setCurrentRange] = useState({start: null, end: null});
    const [selectedHASMonteur, setSelectedHASMonteur] = useState('');
    const [hasMonteurs, setHasMonteurs] = useState([]);
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date()); 

    
    const fetchHasMonteurs = useCallback(async () => {
        try {
            const response = await axiosPrivate.get('/api/users');
            const users = response.data;

            
            const monteurs = users.filter(user => {
                return user.roles &&
                    typeof user.roles === 'object' &&
                    user.roles.HASMonteur === 2023;
            });

            console.log('Found HAS Monteurs:', monteurs);
            setHasMonteurs(monteurs);
        } catch (error) {
            console.error('Error fetching HAS Monteurs:', error);
        }
    }, [axiosPrivate]);

    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);

            const response = await axiosPrivate.get('/api/apartment/appointments/all-hasmonteur', {
                params: {
                    limit: 500, 
                }
            });

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
                        : [parseInt(startHours) + 1, startMinutes];

                    const startDateTime = new Date(appointmentDate);
                    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

                    const endDateTime = new Date(appointmentDate);
                    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

                    
                    const duration = Math.max(differenceInMinutes(endDateTime, startDateTime), 30);

                    return {
                        id: flat._id,
                        title: `${appointmentData.type}: ${flat.complexNaam || `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`}`,
                        start: startDateTime,
                        end: endDateTime,
                        duration: duration,
                        personName: flat.hasMonteur.hasMonteurName, 
                        resource: {
                            address: `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`,
                            type: appointmentData.type,
                            notes: flat.hasMonteur.notes || 'No notes',
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

        
        fetchHasMonteurs();
        
        
        fetchAppointments();
    }, [fetchHasMonteurs, fetchAppointments]);

    const handleHASMonteurFilter = (e) => {
        const selectedName = e.target.value;
        setSelectedHASMonteur(selectedName);

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
        navigate(`/hm-apartment/${resource.flatId}`);
    };

    const eventStyleGetter = (event) => {
        const isStoring = event.resource.type === 'Storing';

        
        const baseHeight = 30; 
        const minDuration = 30; 
        const maxDuration = 240; 
        const normalizedDuration = Math.min(Math.max(event.duration, minDuration), maxDuration);

        
        const heightMultiplier = Math.log(normalizedDuration / minDuration + 1);

        return {
            style: {
                backgroundColor: isStoring ? '#e74c3c' : '#2ecc71',
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: `1px solid ${isStoring ? '#c0392b' : '#27ae60'}`,
                display: 'block',
                padding: '5px 10px',
                height: `${baseHeight * heightMultiplier}px`, 
                overflow: 'hidden',
                fontSize: `${Math.max(10, 14 - (normalizedDuration / 60))}px` 
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
                {hasMonteurs.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <label htmlFor="hasMonteurFilter" style={{
                            marginRight: '10px',
                            fontWeight: 'bold'
                        }}>
                            Select HAS Monteur:
                        </label>
                        <select
                            id="hasMonteurFilter"
                            value={selectedHASMonteur}
                            onChange={handleHASMonteurFilter}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                minWidth: '250px'
                            }}
                        >
                            <option value="">All HAS Monteurs</option>
                            {hasMonteurs.map(monteur => (
                                <option key={monteur._id} value={monteur.name}>
                                    {monteur.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            
            <div style={{
                backgroundColor: '#e8f5e8',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '10px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#2c6e49',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>💡 <strong>Navigation:</strong> Use "Vorige" and "Volgende" buttons to view appointments from different months</span>
                <span style={{ fontWeight: 'bold' }}>
                    Viewing: {format(currentDisplayMonth, 'MMMM yyyy', { locale: nl })}
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
                    tooltipAccessor={event => `${event.title}\nType: ${event.resource.type}\nDuration: ${event.duration} minutes\nPerson: ${event.personName}`}
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
                        <BounceLoader color="#2ecc71"/>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HASInstallerAgendaCalendarPage;
