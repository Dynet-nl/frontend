// Calendar view for technical planning showing appointment schedules and availability.

import React, { useEffect, useState, useCallback, ChangeEvent, FocusEvent } from 'react';
import { Calendar, dateFnsLocalizer, DateLocalizer, View } from 'react-big-calendar';
import logger from '../utils/logger';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar-time-display.css';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { BounceLoader } from 'react-spinners';
import { fetchUserColors, getUserColor, darkenColor } from '../utils/userColors';

interface CalendarEventResource {
    address: string;
    phone: string;
    notes: string;
    flatId: string;
    complexNaam: string;
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    personName?: string;
    resource: CalendarEventResource;
}

interface TechnischeSchouwer {
    _id: string;
    name: string;
    roles?: {
        TechnischeSchouwer?: number;
    };
}

interface FlatAppointment {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    complexNaam?: string;
    technischePlanning?: {
        appointmentBooked?: {
            date: string;
            startTime: string;
            endTime?: string;
            weekNumber?: number;
        };
        technischeSchouwerName?: string;
        telephone?: string;
        additionalNotes?: string;
    };
}

const locales = {
    nl: nl,
};

const localizer: DateLocalizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

// Custom formats for better time display
const formats = {
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: (
        { start, end }: { start: Date; end: Date },
        culture: string | undefined,
        localizer: DateLocalizer | undefined
    ): string => (localizer ? localizer.format(start, 'HH:mm', culture) + ' - ' + localizer.format(end, 'HH:mm', culture) : ''),
    dayHeaderFormat: 'eeee, d MMMM yyyy',
    dayRangeHeaderFormat: (
        { start, end }: { start: Date; end: Date },
        culture: string | undefined,
        localizer: DateLocalizer | undefined
    ): string => (localizer ? localizer.format(start, 'd MMMM', culture) + ' - ' + localizer.format(end, 'd MMMM yyyy', culture) : ''),
};

const TechnicalPlanningAgendaCalendarPage: React.FC = () => {
    const axiosPrivate = useAxiosPrivate();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [originalEvents, setOriginalEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [technischeSchouwers, setTechnischeSchouwers] = useState<TechnischeSchouwer[]>([]);
    const [selectedSchouwer, setSelectedSchouwer] = useState<string>('');
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(new Date());

    const fetchTechnischeSchouwers = useCallback(async (): Promise<void> => {
        try {
            const response = await axiosPrivate.get<{ data: TechnischeSchouwer[]; pagination?: unknown } | TechnischeSchouwer[]>('/api/users');
            // Handle both paginated response { data: [...] } and legacy array response
            const users = Array.isArray(response.data) ? response.data : response.data.data;
            const schouwers = users.filter((user) => {
                return user.roles && typeof user.roles === 'object' && user.roles.TechnischeSchouwer === 8687;
            });
            logger.log('Found Technische Schouwers:', schouwers);
            setTechnischeSchouwers(schouwers);

            await fetchUserColors(axiosPrivate);
        } catch (error) {
            logger.error('Error fetching technische schouwers:', error);
        }
    }, [axiosPrivate]);

    const fetchAppointments = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            logger.log('Fetching all appointments without date filtering.');
            const response = await axiosPrivate.get<FlatAppointment[]>('/api/apartment/appointments/all-technischeplanning', {
                params: {
                    limit: 500,
                },
            });
            if (response?.data?.length > 0) {
                logger.log('Appointments fetched successfully:', response.data);
            } else {
                logger.log('No appointments found.');
            }
            const calendarEvents: CalendarEvent[] = response.data
                .filter((flat) => flat.technischePlanning?.appointmentBooked?.date && flat.technischePlanning?.appointmentBooked?.startTime)
                .map((flat) => {
                    const appointmentDate = new Date(flat.technischePlanning!.appointmentBooked!.date);
                    const [startHours, startMinutes] = flat.technischePlanning!.appointmentBooked!.startTime.split(':');
                    const endTimeParts = flat.technischePlanning!.appointmentBooked!.endTime
                        ? flat.technischePlanning!.appointmentBooked!.endTime.split(':')
                        : [String(parseInt(startHours) + 1), startMinutes];
                    const [endHours, endMinutes] = endTimeParts;
                    const startDateTime = new Date(appointmentDate);
                    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
                    const endDateTime = new Date(appointmentDate);
                    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
                    return {
                        id: flat._id,
                        title: `Technical Inspection - ${flat.complexNaam || `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`}`,
                        start: startDateTime,
                        end: endDateTime,
                        personName: flat.technischePlanning?.technischeSchouwerName,
                        resource: {
                            address: `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`,
                            phone: flat.technischePlanning?.telephone || 'Not provided',
                            notes: flat.technischePlanning?.additionalNotes || 'No notes',
                            flatId: flat._id,
                            complexNaam: flat.complexNaam || 'N/A',
                        },
                    };
                });
            setOriginalEvents(calendarEvents);
            setEvents(calendarEvents);
        } catch (error) {
            logger.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    }, [axiosPrivate]);

    useEffect(() => {
        fetchTechnischeSchouwers();
        fetchAppointments();
    }, [fetchTechnischeSchouwers, fetchAppointments]);

    const handleSchouwerFilter = (e: ChangeEvent<HTMLSelectElement>): void => {
        const selectedName = e.target.value;
        setSelectedSchouwer(selectedName);
        if (!selectedName) {
            setEvents(originalEvents);
        } else {
            const filteredEvents = originalEvents.filter((event) => event.personName === selectedName);
            setEvents(filteredEvents);

            if (filteredEvents.length > 0) {
                const firstAppointment = filteredEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
                const appointmentMonth = new Date(firstAppointment.start);
                setCurrentDisplayMonth(appointmentMonth);
                logger.log(
                    `Auto-navigated to ${appointmentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} for ${selectedName}'s first appointment`
                );
            }
        }
    };

    const handleRangeChange = (range: Date[] | { start: Date; end: Date }): void => {
        if (!Array.isArray(range) && range.start && range.end) {
            logger.log('Calendar range changed to:', range.start, 'to', range.end);
        }
    };

    const handleEventClick = (event: CalendarEvent): void => {
        const { resource } = event;
        alert(`
            📋 Technical Inspection Details
            ═══════════════════════════════
            🏠 Address: ${resource.address}
            📞 Phone: ${resource.phone}
            📝 Notes: ${resource.notes}
            🏢 Complex: ${resource.complexNaam}
            👷 Inspector: ${event.personName || 'Not assigned'}
        `);
    };

    const eventStyleGetter = (event: CalendarEvent): { style: React.CSSProperties } => {
        const duration = event.end && event.start ? (event.end.getTime() - event.start.getTime()) / (1000 * 60) : 60;

        const baseHeight = 40;
        const heightPerHour = 30;
        const durationInHours = duration / 60;
        const calculatedHeight = baseHeight + durationInHours * heightPerHour;

        const finalHeight = Math.max(baseHeight, Math.min(calculatedHeight, 120));

        const userColor = getUserColor(event.personName || '', '#3498db');
        const borderColor = darkenColor(userColor, 15);

        return {
            style: {
                backgroundColor: userColor,
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
                lineHeight: '1.3',
            },
        };
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
            }}
        >
            <div
                style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden',
                }}
            >
                {/* Header Section */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        padding: '40px',
                        borderBottom: '1px solid #e2e8f0',
                    }}
                >
                    <h1
                        style={{
                            color: '#2c3e50',
                            fontSize: '32px',
                            fontWeight: '700',
                            margin: '0 0 10px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                    >
                        <span style={{ fontSize: '36px' }}>📅</span>
                        Technical Planning Calendar
                    </h1>
                    <p
                        style={{
                            color: '#6c757d',
                            fontSize: '18px',
                            margin: '0',
                            fontWeight: '400',
                        }}
                    >
                        View and manage technical inspection appointments
                    </p>
                </div>

                {/* Content Section */}
                <div style={{ padding: '40px' }}>
                    {/* Filter Section */}
                    {technischeSchouwers.length > 0 && (
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                                border: '2px solid #e2e8f0',
                                borderRadius: '16px',
                                padding: '24px',
                                marginBottom: '32px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <label
                                    htmlFor="schouwerFilter"
                                    style={{
                                        color: '#374151',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    👷 Filter by Inspector:
                                </label>
                                <select
                                    id="schouwerFilter"
                                    value={selectedSchouwer}
                                    onChange={handleSchouwerFilter}
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
                                        cursor: 'pointer',
                                    }}
                                    onFocus={(e: FocusEvent<HTMLSelectElement>) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e: FocusEvent<HTMLSelectElement>) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">All Technical Inspectors</option>
                                    {technischeSchouwers.map((schouwer) => (
                                        <option key={schouwer._id} value={schouwer.name}>
                                            {schouwer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Calendar Section */}
                    <div
                        style={{
                            background: '#ffffff',
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                            minHeight: '600px',
                        }}
                    >
                        {/* Info Banner */}
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
                                padding: '16px',
                                borderBottom: '1px solid #e2e8f0',
                                textAlign: 'center',
                                fontSize: '14px',
                                color: '#0277bd',
                                fontWeight: '500',
                            }}
                        >
                            📋 Click on any appointment to view details • Use the filter above to view specific inspector schedules
                            {selectedSchouwer && (
                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#1565c0' }}>
                                    • Currently showing: {selectedSchouwer} ({events.length} appointments)
                                    <br />
                                    📅 Auto-navigated to {currentDisplayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </div>
                            )}
                        </div>

                        {/* Calendar Content */}
                        <div style={{ padding: '20px', height: '700px' }}>
                            {loading ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        gap: '20px',
                                    }}
                                >
                                    <BounceLoader color="#667eea" size={60} />
                                    <p style={{ color: '#6c757d', fontSize: '16px', margin: '0' }}>Loading appointments...</p>
                                </div>
                            ) : (
                                <Calendar
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: '100%' }}
                                    date={currentDisplayMonth}
                                    onNavigate={(newDate: Date) => setCurrentDisplayMonth(newDate)}
                                    onRangeChange={handleRangeChange}
                                    onSelectEvent={handleEventClick}
                                    eventPropGetter={eventStyleGetter}
                                    views={['month', 'week', 'day'] as View[]}
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
        </div>
    );
};

export default TechnicalPlanningAgendaCalendarPage;
