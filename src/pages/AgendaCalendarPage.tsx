// Unified calendar view for both technical planning and HAS installer appointments.

import React, { useEffect, useState, useCallback, ChangeEvent, FocusEvent } from 'react';
import { Calendar, dateFnsLocalizer, DateLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, differenceInMinutes } from 'date-fns';
import { nl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar-time-display.css';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { BounceLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';
import { fetchUserColors, getUserColor, darkenColor } from '../utils/userColors';
import { ConfirmModal } from '../components/ui';
import { useNotification } from '../context/NotificationProvider';
import logger from '../utils/logger';

interface CalendarEventResource {
    address: string;
    phone?: string;
    type?: string;
    notes: string;
    flatId: string;
    complexNaam: string;
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    duration: number;
    personName?: string;
    resource: CalendarEventResource;
}

interface PersonnelUser {
    _id: string;
    name: string;
    roles?: Record<string, number | boolean>;
}

interface TechnicalFlatAppointment {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    complexNaam?: string;
    postcode?: string;
    technischePlanning?: {
        _id?: string;
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

interface HASFlatAppointment {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    complexNaam?: string;
    postcode?: string;
    hasMonteur?: {
        _id?: string;
        appointmentBooked?: {
            date: string;
            startTime: string;
            endTime?: string;
            type?: string;
        };
        hasMonteurName?: string;
        installation?: unknown;
    };
}

interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface AgendaCalendarPageProps {
    calendarType: 'HAS' | 'TECHNICAL';
}

const locales = { nl };

const localizer: DateLocalizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const formats = {
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: (
        { start, end }: { start: Date; end: Date },
        culture: string | undefined,
        loc: DateLocalizer | undefined
    ): string => (loc ? loc.format(start, 'HH:mm', culture) + ' - ' + loc.format(end, 'HH:mm', culture) : ''),
    dayHeaderFormat: 'eeee, d MMMM yyyy',
    dayRangeHeaderFormat: (
        { start, end }: { start: Date; end: Date },
        culture: string | undefined,
        loc: DateLocalizer | undefined
    ): string => (loc ? loc.format(start, 'd MMMM', culture) + ' - ' + loc.format(end, 'd MMMM yyyy', culture) : ''),
};

// Type-specific configuration
const CONFIG = {
    HAS: {
        title: 'HAS Installation Calendar',
        subtitle: 'View and manage HAS installation appointments',
        icon: '\u{1F527}',
        filterLabel: 'Filter by HAS Monteur:',
        filterPlaceholder: 'All HAS Monteurs',
        endpoint: '/api/apartment/appointments/all-hasmonteur',
        roleKey: 'HASMonteur',
        roleValue: 2023,
        personnelField: 'hasMonteurName' as const,
        bannerGradient: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
        bannerColor: '#2e7d32',
        apartmentRoute: '/hm-apartment',
        detailsTitle: 'HAS Installation Details',
    },
    TECHNICAL: {
        title: 'Technical Planning Calendar',
        subtitle: 'View and manage technical inspection appointments',
        icon: '\u{1F4C5}',
        filterLabel: 'Filter by Inspector:',
        filterPlaceholder: 'All Technical Inspectors',
        endpoint: '/api/apartment/appointments/all-technischeplanning',
        roleKey: 'TechnischeSchouwer',
        roleValue: 8687,
        personnelField: 'technischeSchouwerName' as const,
        bannerGradient: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
        bannerColor: '#0277bd',
        apartmentRoute: '/planning-apartment',
        detailsTitle: 'Technical Inspection Details',
    },
};

const AgendaCalendarPage: React.FC<AgendaCalendarPageProps> = ({ calendarType }) => {
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const { showError } = useNotification();
    const config = CONFIG[calendarType];

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [originalEvents, setOriginalEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [personnel, setPersonnel] = useState<PersonnelUser[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<string>('');
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(new Date());
    const [eventDetailsModal, setEventDetailsModal] = useState<{ isOpen: boolean; event: CalendarEvent | null }>({
        isOpen: false,
        event: null,
    });

    const fetchPersonnel = useCallback(async (): Promise<void> => {
        try {
            const response = await axiosPrivate.get<PaginatedResponse<PersonnelUser> | PersonnelUser[]>('/api/users');
            const users = Array.isArray(response.data) ? response.data : response.data.data;
            const filtered = users.filter((user) => {
                if (!user.roles || typeof user.roles !== 'object') return false;
                const roleVal = user.roles[config.roleKey];
                return roleVal && (roleVal === config.roleValue || (typeof roleVal === 'number' && roleVal > 0));
            });
            setPersonnel(filtered);
            await fetchUserColors(axiosPrivate);
        } catch (error) {
            logger.error(`Error fetching ${calendarType} personnel:`, error);
            showError('Failed to load personnel list');
        }
    }, [axiosPrivate, calendarType, config.roleKey, config.roleValue, showError]);

    const parseAppointments = useCallback((responseData: unknown): CalendarEvent[] => {
        // Handle paginated response { data: [...], pagination: {...} } or plain array
        const items = Array.isArray(responseData)
            ? responseData
            : (responseData as PaginatedResponse<unknown>).data;

        if (!Array.isArray(items)) return [];

        if (calendarType === 'HAS') {
            return (items as HASFlatAppointment[])
                .filter((flat) => flat.hasMonteur?.appointmentBooked?.date && flat.hasMonteur?.appointmentBooked?.startTime)
                .map((flat) => {
                    const appt = flat.hasMonteur!.appointmentBooked!;
                    const appointmentDate = new Date(appt.date);
                    const [startH, startM] = appt.startTime.split(':');
                    const endParts = appt.endTime ? appt.endTime.split(':') : [String(parseInt(startH) + 1), startM];
                    const start = new Date(appointmentDate);
                    start.setHours(parseInt(startH), parseInt(startM), 0, 0);
                    const end = new Date(appointmentDate);
                    end.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
                    const duration = Math.max(differenceInMinutes(end, start), 30);

                    return {
                        id: flat._id,
                        title: `${appt.type || 'HAS'} Installation - ${flat.complexNaam || `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`}`,
                        start,
                        end,
                        duration,
                        personName: flat.hasMonteur?.hasMonteurName,
                        resource: {
                            address: `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`,
                            type: appt.type || 'HAS',
                            notes: 'No notes',
                            flatId: flat._id,
                            complexNaam: flat.complexNaam || 'N/A',
                        },
                    };
                });
        } else {
            return (items as TechnicalFlatAppointment[])
                .filter((flat) => flat.technischePlanning?.appointmentBooked?.date && flat.technischePlanning?.appointmentBooked?.startTime)
                .map((flat) => {
                    const appt = flat.technischePlanning!.appointmentBooked!;
                    const appointmentDate = new Date(appt.date);
                    const [startH, startM] = appt.startTime.split(':');
                    const endParts = appt.endTime ? appt.endTime.split(':') : [String(parseInt(startH) + 1), startM];
                    const start = new Date(appointmentDate);
                    start.setHours(parseInt(startH), parseInt(startM), 0, 0);
                    const end = new Date(appointmentDate);
                    end.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
                    const duration = Math.max(differenceInMinutes(end, start), 30);

                    return {
                        id: flat._id,
                        title: `Technical Inspection - ${flat.complexNaam || `${flat.adres} ${flat.huisNummer}${flat.toevoeging || ''}`}`,
                        start,
                        end,
                        duration,
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
        }
    }, [calendarType]);

    const fetchAppointments = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            const response = await axiosPrivate.get(config.endpoint, {
                params: { limit: 500 },
            });
            const calendarEvents = parseAppointments(response.data);
            setOriginalEvents(calendarEvents);
            setEvents(calendarEvents);
        } catch (error) {
            logger.error('Error fetching appointments:', error);
            showError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    }, [axiosPrivate, config.endpoint, parseAppointments, showError]);

    useEffect(() => {
        fetchPersonnel();
        fetchAppointments();
    }, [fetchPersonnel, fetchAppointments]);

    const handlePersonnelFilter = (e: ChangeEvent<HTMLSelectElement>): void => {
        const selectedName = e.target.value;
        setSelectedPerson(selectedName);

        if (!selectedName) {
            setEvents(originalEvents);
        } else {
            const filteredEvents = originalEvents.filter((event) => {
                const name = event.personName || '';
                return name.toLowerCase().includes(selectedName.toLowerCase()) || name === selectedName;
            });
            setEvents(filteredEvents);

            if (filteredEvents.length > 0) {
                const sorted = [...filteredEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
                setCurrentDisplayMonth(new Date(sorted[0].start));
            }
        }
    };

    const handleRangeChange = (range: Date[] | { start: Date; end: Date }): void => {
        if (!Array.isArray(range) && range.start && range.end) {
            logger.log('Calendar range changed to:', range.start, 'to', range.end);
        }
    };

    const handleEventClick = (event: CalendarEvent): void => {
        setEventDetailsModal({ isOpen: true, event });
    };

    const handleViewApartment = (): void => {
        const event = eventDetailsModal.event;
        if (event?.resource?.flatId) {
            navigate(`${config.apartmentRoute}/${event.resource.flatId}`);
        }
        setEventDetailsModal({ isOpen: false, event: null });
    };

    const eventStyleGetter = (event: CalendarEvent): { style: React.CSSProperties } => {
        const duration = event.duration || 30;
        const baseHeight = 40;
        const heightPerHour = 30;
        const durationInHours = duration / 60;
        const calculatedHeight = baseHeight + durationInHours * heightPerHour;
        const finalHeight = Math.max(baseHeight, Math.min(calculatedHeight, 120));

        let backgroundColor: string;
        let borderColor: string;
        if (event.personName) {
            const userColor = getUserColor(event.personName);
            backgroundColor = userColor;
            borderColor = darkenColor(userColor, 15);
        } else {
            const isStoring = event.resource.type === 'Storing';
            backgroundColor = isStoring ? '#e74c3c' : calendarType === 'HAS' ? '#2ecc71' : '#3498db';
            borderColor = isStoring ? '#c0392b' : calendarType === 'HAS' ? '#27ae60' : '#2980b9';
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
                lineHeight: '1.3',
            },
        };
    };

    const modalEvent = eventDetailsModal.event;

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
                {/* Header */}
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
                        <span style={{ fontSize: '36px' }}>{config.icon}</span>
                        {config.title}
                    </h1>
                    <p style={{ color: '#6c757d', fontSize: '18px', margin: '0', fontWeight: '400' }}>
                        {config.subtitle}
                    </p>
                </div>

                {/* Content */}
                <div style={{ padding: '40px' }}>
                    {/* Filter */}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <label
                                htmlFor="personnelFilter"
                                style={{
                                    color: '#374151',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                {config.icon} {config.filterLabel}
                            </label>
                            <select
                                id="personnelFilter"
                                value={selectedPerson}
                                onChange={handlePersonnelFilter}
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
                                <option value="">{config.filterPlaceholder}</option>
                                {personnel.map((person) => (
                                    <option key={person._id} value={person.name}>
                                        {person.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Calendar */}
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
                                background: config.bannerGradient,
                                padding: '16px',
                                borderBottom: '1px solid #e2e8f0',
                                textAlign: 'center',
                                fontSize: '14px',
                                color: config.bannerColor,
                                fontWeight: '500',
                            }}
                        >
                            Click on any appointment to view details - Use the filter above to view specific schedules
                            {selectedPerson && (
                                <span style={{ marginLeft: '16px', fontWeight: '600' }}>
                                    - Currently showing: {selectedPerson} ({events.length} appointments)
                                    {events.length > 0 && (
                                        <span style={{ marginLeft: '8px', color: '#1976d2' }}>
                                            Auto-navigated to {currentDisplayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </span>
                                    )}
                                </span>
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

            {/* Event Details Modal */}
            {modalEvent && (
                <ConfirmModal
                    open={eventDetailsModal.isOpen}
                    title={`${config.icon} ${config.detailsTitle}`}
                    message={
                        <div style={{ textAlign: 'left', lineHeight: '1.8' }}>
                            <p><strong>Address:</strong> {modalEvent.resource.address}</p>
                            {calendarType === 'HAS' && modalEvent.resource.type && (
                                <p><strong>Type:</strong> {modalEvent.resource.type}</p>
                            )}
                            {calendarType === 'TECHNICAL' && modalEvent.resource.phone && (
                                <p><strong>Phone:</strong> {modalEvent.resource.phone}</p>
                            )}
                            <p><strong>Notes:</strong> {modalEvent.resource.notes || 'None'}</p>
                            <p><strong>Complex:</strong> {modalEvent.resource.complexNaam}</p>
                            <p><strong>{calendarType === 'HAS' ? 'Installer' : 'Inspector'}:</strong> {modalEvent.personName || 'Not assigned'}</p>
                            <p><strong>Duration:</strong> {modalEvent.duration} minutes</p>
                        </div>
                    }
                    confirmText="View Apartment"
                    cancelText="Close"
                    onConfirm={handleViewApartment}
                    onClose={() => setEventDetailsModal({ isOpen: false, event: null })}
                />
            )}
        </div>
    );
};

export default AgendaCalendarPage;
