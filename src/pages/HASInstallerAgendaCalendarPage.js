// Calendar view for HAS installers showing appointment schedules and availability.

import React, {useEffect, useState, useCallback} from 'react';
import {Calendar, dateFnsLocalizer} from 'react-big-calendar';
import {format, parse, startOfWeek, getDay} from 'date-fns';
import {nl} from 'date-fns/locale';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar-time-display.css';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import {BounceLoader} from 'react-spinners';
import {useNavigate} from 'react-router-dom';
import { fetchUserColors, getUserColor, darkenColor } from '../utils/userColors';
import { ConfirmModal } from '../components/ui';
import logger from '../utils/logger';

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

// Custom formats for better time display
const formats = {
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: ({start, end}, culture, localizer) =>
        localizer.format(start, 'HH:mm', culture) + ' - ' + 
        localizer.format(end, 'HH:mm', culture),
    dayHeaderFormat: 'eeee, d MMMM yyyy',
    dayRangeHeaderFormat: ({start, end}, culture, localizer) =>
        localizer.format(start, 'd MMMM', culture) + ' - ' + 
        localizer.format(end, 'd MMMM yyyy', culture)
};
const HASInstallerAgendaCalendarPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [originalEvents, setOriginalEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedHASMonteur, setSelectedHASMonteur] = useState('');
    const [hasMonteurs, setHasMonteurs] = useState([]);
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
    const [eventDetailsModal, setEventDetailsModal] = useState({ isOpen: false, event: null }); 
    const fetchHasMonteurs = useCallback(async () => {
        try {
            const response = await axiosPrivate.get('/api/users');
            const users = response.data;
            
            await fetchUserColors(axiosPrivate);
            
            logger.log('All users from API:', users);
            users.forEach(user => {
                logger.log(`User: ${user.name}, Roles:`, user.roles);
                if (user.roles) {
                    Object.keys(user.roles).forEach(roleKey => {
                        logger.log(`  - ${roleKey}: ${user.roles[roleKey]}`);
                    });
                }
            });
            
            const monteurs = users.filter(user => {
                if (!user.roles || typeof user.roles !== 'object') {
                    logger.log(`User ${user.name} has no roles or invalid roles structure`);
                    return false;
                }
                
                const hasMonteur = user.roles.HASMonteur;
                const isHASMonteur = hasMonteur && (
                    hasMonteur === 2023 || 
                    hasMonteur === true || 
                    hasMonteur === 1 ||
                    (typeof hasMonteur === 'number' && hasMonteur > 0)
                );
                
                logger.log(`User ${user.name} - HASMonteur value: ${hasMonteur}, matches: ${isHASMonteur}`);
                return isHASMonteur;
            });
            
            logger.log('Found HAS Monteur users:', monteurs);
            setHasMonteurs(monteurs);
        } catch (error) {
            logger.error('Error fetching HAS Monteur users:', error);
            
            const fallbackUsers = [
                { _id: 'jasper', name: 'jasper', email: 'jasper@example.com' },
                { _id: 'john-doe', name: 'John Doe', email: 'john.doe@example.com' }
            ];
            
            logger.log('Using fallback users for filtering:', fallbackUsers);
            setHasMonteurs(fallbackUsers);
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
            logger.log('Raw HAS appointments response:', response.data);
            
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
                    
                    logger.log('Processing appointment for:', flat.hasMonteur.hasMonteurName);
                    
                    return {
                        id: flat._id,
                        title: `${appointmentData.type} Installation - ${flat.complexNaam || `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`}`,
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
            logger.log('Processed calendar events:', calendarEvents);
            setOriginalEvents(calendarEvents);
            setEvents(calendarEvents);
        } catch (error) {
            logger.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    }, [axiosPrivate]);
    useEffect(() => {
        fetchHasMonteurs();
        fetchAppointments();
    }, [fetchHasMonteurs, fetchAppointments]);
    const handleHASMonteurFilter = (e) => {
        const selectedName = e.target.value;
        setSelectedHASMonteur(selectedName);
        
        if (!selectedName) {
            setEvents(originalEvents);
        } else {
            const filteredEvents = originalEvents.filter(event => {
                const eventPersonName = event.personName || '';
                return eventPersonName.toLowerCase().includes(selectedName.toLowerCase()) ||
                       eventPersonName === selectedName;
            });
            setEvents(filteredEvents);
            
            if (filteredEvents.length > 0) {
                const sortedEvents = filteredEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
                const firstAppointment = sortedEvents[0];
                const appointmentMonth = new Date(firstAppointment.start);
                
                setCurrentDisplayMonth(appointmentMonth);
                
                logger.log(`Auto-navigating to ${appointmentMonth.toLocaleDateString()} for ${selectedName}'s appointments`);
            }
            
            logger.log(`Filtering for: ${selectedName}`);
            logger.log(`Found ${filteredEvents.length} events out of ${originalEvents.length} total`);
        }
    };
    const handleRangeChange = (range) => {
        if (range.start && range.end) {
            logger.log('Calendar range changed to:', range.start, 'to', range.end);
        }
    };
    const handleEventClick = (event) => {
        setEventDetailsModal({ isOpen: true, event });
    };
    
    const handleViewApartment = () => {
        const event = eventDetailsModal.event;
        if (event?.resource?.flatId) {
            navigate(`/hm-apartment/${event.resource.flatId}`);
        }
        setEventDetailsModal({ isOpen: false, event: null });
    };
    const eventStyleGetter = (event) => {
        const isStoring = event.resource.type === 'Storing';
const duration = event.duration || 30;
        
const baseHeight = 40;
const heightPerHour = 30;
        const durationInHours = duration / 60;
        const calculatedHeight = baseHeight + (durationInHours * heightPerHour);
        
        const finalHeight = Math.max(baseHeight, Math.min(calculatedHeight, 120));
        
        let backgroundColor, borderColor;
        if (event.personName) {
            const userColor = getUserColor(event.personName);
            backgroundColor = userColor;
            borderColor = darkenColor(userColor, 15);
        } else {
            backgroundColor = isStoring ? '#e74c3c' : '#2ecc71';
            borderColor = isStoring ? '#c0392b' : '#27ae60';
        }
        
        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: `1px solid ${borderColor}`,
                display: 'block',
                padding: '5px 10px',
                height: `${finalHeight}px`,
                minHeight: `${baseHeight}px`,
                overflow: 'hidden',
                fontSize: '12px',
                fontWeight: '500',
                lineHeight: '1.3'
            }
        };
    };
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                background: '#ffffff',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
            }}>
                {/* Header Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    padding: '40px',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    <h1 style={{ 
                        color: '#2c3e50', 
                        fontSize: '32px', 
                        fontWeight: '700',
                        margin: '0 0 10px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{fontSize: '36px'}}>🔧</span>
                        HAS Installation Calendar
                    </h1>
                    <p style={{ 
                        color: '#6c757d', 
                        fontSize: '18px', 
                        margin: '0',
                        fontWeight: '400'
                    }}>
                        View and manage HAS installation appointments
                    </p>
                </div>

                {/* Content Section */}
                <div style={{ padding: '40px' }}>
                    {/* Filter Section */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                        border: '2px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '32px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap'
                        }}>
                            <label 
                                htmlFor="hasMonteurFilter" 
                                style={{
                                    color: '#374151',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                🔧 Filter by HAS Monteur:
                            </label>
                            <select
                                id="hasMonteurFilter"
                                value={selectedHASMonteur}
                                onChange={handleHASMonteurFilter}
                                style={{
                                    padding: '12px 16px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '10px',
                                    fontSize: '16px',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: '#ffffff',
                                    color: '#374151',
                                    outline: 'none',
                                    minWidth: '280px',
                                    cursor: 'pointer'
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
                                <option value="">All HAS Monteurs</option>
                                {hasMonteurs.length === 0 ? (
                                    <option disabled>Loading monteurs...</option>
                                ) : (
                                    hasMonteurs.map(monteur => (
                                        <option key={monteur._id} value={monteur.name}>
                                            {monteur.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            {hasMonteurs.length === 0 && (
                                <span style={{ 
                                    color: '#dc3545', 
                                    fontSize: '14px',
                                    fontStyle: 'italic'
                                }}>
                                    No HAS monteurs found. Check console for debug info.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Calendar Section */}
                    <div style={{
                        background: '#ffffff',
                        border: '2px solid #e2e8f0',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        minHeight: '600px'
                    }}>
                        {/* Info Banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                            padding: '16px',
                            borderBottom: '1px solid #e2e8f0',
                            textAlign: 'center',
                            fontSize: '14px',
                            color: '#2e7d32',
                            fontWeight: '500'
                        }}>
                            🔧 Click on any appointment to view details • Use the filter above to view specific monteur schedules
                            {selectedHASMonteur && (
                                <span style={{ marginLeft: '16px', fontWeight: '600' }}>
                                    • Currently showing: {selectedHASMonteur} ({events.length} appointments)
                                    {events.length > 0 && (
                                        <span style={{ marginLeft: '8px', color: '#1976d2' }}>
                                            📅 Auto-navigated to {currentDisplayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>

                        {/* Calendar Content */}
                        <div style={{ padding: '20px', height: '700px' }}>
                            {loading ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    gap: '20px'
                                }}>
                                    <BounceLoader color="#667eea" size={60}/>
                                    <p style={{color: '#6c757d', fontSize: '16px', margin: '0'}}>Loading appointments...</p>
                                </div>
                            ) : (
                                <Calendar
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: '100%' }}
                                    date={currentDisplayMonth}
                                    onNavigate={(newDate) => setCurrentDisplayMonth(newDate)}
                                    onRangeChange={handleRangeChange}
                                    onSelectEvent={handleEventClick}
                                    eventPropGetter={eventStyleGetter}
                                    views={['month', 'week', 'day']}
                                    defaultView="month"
                                    min={new Date(2024, 0, 1, 6, 0, 0)}
                                    max={new Date(2024, 0, 1, 22, 0, 0)}
                                    step={60}
                                    timeslots={1}
                                    showMultiDayTimes={true}
                                    formats={formats}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Event Details Modal */}
            {eventDetailsModal.isOpen && eventDetailsModal.event && (
                <ConfirmModal
                    isOpen={true}
                    title="🔧 HAS Installation Details"
                    message={
                        <div style={{ textAlign: 'left', lineHeight: '1.8' }}>
                            <p><strong>🏠 Address:</strong> {eventDetailsModal.event.resource?.address}</p>
                            <p><strong>🔧 Type:</strong> {eventDetailsModal.event.resource?.type}</p>
                            <p><strong>📝 Notes:</strong> {eventDetailsModal.event.resource?.notes || 'None'}</p>
                            <p><strong>🏢 Complex:</strong> {eventDetailsModal.event.resource?.complexNaam}</p>
                            <p><strong>👷 Installer:</strong> {eventDetailsModal.event.personName || 'Not assigned'}</p>
                            <p><strong>⏱️ Duration:</strong> {eventDetailsModal.event.duration || 'Not specified'} minutes</p>
                        </div>
                    }
                    confirmText="View Apartment"
                    cancelText="Close"
                    onConfirm={handleViewApartment}
                    onCancel={() => setEventDetailsModal({ isOpen: false, event: null })}
                />
            )}
        </div>
    );
};
export default HASInstallerAgendaCalendarPage;
