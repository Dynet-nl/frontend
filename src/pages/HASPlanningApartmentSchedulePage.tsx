// HAS planning interface for scheduling apartments with HAS-specific appointment options.

import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import logger from '../utils/logger';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { generateHBNumber } from '../utils/buildingCategorization';
import { LoadingState } from '../components/ui';
import { useNotification } from '../context/NotificationProvider';
import '../styles/tsApartmentDetails.css';

interface Flat {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    hasMonteur?: {
        appointmentBooked?: {
            date?: string;
            startTime?: string;
            endTime?: string;
            weekNumber?: number;
            type?: string;
            complaintDetails?: string;
        };
        hasMonteurName?: string;
    };
}

interface Building {
    _id: string;
    address?: string;
    name?: string;
    flats: Flat[];
}

interface HASMonteur {
    _id: string;
    name: string;
    roles?: {
        HASMonteur?: number;
    };
}

interface AppointmentData {
    date: string;
    startTime: string;
    endTime: string;
    weekNumber: number | null;
    type: string;
    hasMonteurName: string;
    complaintDetails: string;
}

interface FlatAppointment {
    date: string;
    startTime?: string;
    endTime?: string;
    weekNumber?: number;
    type: string;
    hasMonteurName?: string;
    complaintDetails?: string;
}

const HASPlanningApartmentSchedulePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const axiosPrivate = useAxiosPrivate();
    const { showSuccess, showError, showWarning } = useNotification();
    const [building, setBuilding] = useState<Building | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
    const [hasMonteurs, setHASMonteurs] = useState<HASMonteur[]>([]);
    const [appointmentData, setAppointmentData] = useState<AppointmentData>({
        date: '',
        startTime: '',
        endTime: '',
        weekNumber: null,
        type: 'HAS',
        hasMonteurName: '',
        complaintDetails: '',
    });
    const [flatAppointments, setFlatAppointments] = useState<Record<string, FlatAppointment>>({});

    const calculateWeekNumber = (date: string): number => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const fetchHASMonteurs = async (): Promise<void> => {
        try {
            const response = await axiosPrivate.get<{ data: HASMonteur[]; pagination?: unknown } | HASMonteur[]>('/api/users');
            // Handle both paginated response { data: [...] } and legacy array response
            const users = Array.isArray(response.data) ? response.data : response.data.data;
            const monteurs = users.filter((user) => {
                return user.roles && typeof user.roles === 'object' && user.roles.HASMonteur === 2023;
            });
            setHASMonteurs(monteurs);
        } catch (error) {
            logger.error('Error fetching HAS Monteurs:', error);
        }
    };

    const fetchBuilding = async (): Promise<void> => {
        try {
            const { data } = await axiosPrivate.get<Building>(`/api/building/${id}`);
            setBuilding(data);
            const initialFlatAppointments: Record<string, FlatAppointment> = {};
            data.flats.forEach((flat) => {
                if (flat.hasMonteur?.appointmentBooked?.date) {
                    initialFlatAppointments[flat._id] = {
                        date: formatDate(flat.hasMonteur.appointmentBooked.date),
                        startTime: flat.hasMonteur.appointmentBooked.startTime,
                        endTime: flat.hasMonteur.appointmentBooked.endTime,
                        weekNumber: flat.hasMonteur.appointmentBooked.weekNumber,
                        type: flat.hasMonteur.appointmentBooked.type || 'HAS',
                        hasMonteurName: flat.hasMonteur.hasMonteurName || '',
                        complaintDetails: flat.hasMonteur.appointmentBooked.complaintDetails || '',
                    };
                }
            });
            setFlatAppointments(initialFlatAppointments);
            const apartmentsWithAppointments = data.flats.filter((flat) => flat.hasMonteur?.appointmentBooked?.date).map((flat) => flat._id);
            setSelectedApartments((prevSelected) => {
                const combined = [...new Set([...prevSelected, ...apartmentsWithAppointments])];
                return combined;
            });
            setLoading(false);
        } catch (error) {
            logger.error('Error fetching building data', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuilding();
        fetchHASMonteurs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleApartmentSelection = (flatId: string): void => {
        setSelectedApartments((prevSelected) =>
            prevSelected.includes(flatId) ? prevSelected.filter((id) => id !== flatId) : [...prevSelected, flatId]
        );
    };

    const handleAppointmentChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setAppointmentData((prevData) => ({
            ...prevData,
            [name]: value,
            ...(name === 'date' ? { weekNumber: calculateWeekNumber(value) } : {}),
        }));
    };

    const handleAppointmentSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (appointmentData.endTime <= appointmentData.startTime) {
            showError('End time must be after start time');
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        if (appointmentData.date < today) {
            showWarning('The selected date is in the past');
        }

        setLoading(true);
        try {
            const results = await Promise.allSettled(
                selectedApartments.map(async (flatId) => {
                    const appointmentPayload: {
                        appointmentBooked: {
                            date: string;
                            startTime: string;
                            endTime: string;
                            weekNumber: number | null;
                            type: string;
                            complaintDetails?: string;
                        };
                        hasMonteurName: string;
                    } = {
                        appointmentBooked: {
                            date: appointmentData.date,
                            startTime: appointmentData.startTime,
                            endTime: appointmentData.endTime,
                            weekNumber: appointmentData.weekNumber,
                            type: appointmentData.type,
                        },
                        hasMonteurName: appointmentData.hasMonteurName,
                    };
                    if (appointmentData.type === 'Complaint' && appointmentData.complaintDetails) {
                        appointmentPayload.appointmentBooked.complaintDetails = appointmentData.complaintDetails;
                    }
                    const response = await axiosPrivate.put<Flat>(`/api/apartment/${flatId}/has-monteur`, appointmentPayload);
                    return { flatId, data: response.data };
                })
            );

            const succeeded = results.filter((r): r is PromiseFulfilledResult<{ flatId: string; data: Flat }> => r.status === 'fulfilled');
            const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

            if (succeeded.length > 0) {
                const updatedFlatAppointments = { ...flatAppointments };
                succeeded.forEach(({ value: { flatId, data } }) => {
                    if (data.hasMonteur?.appointmentBooked) {
                        updatedFlatAppointments[flatId] = {
                            date: formatDate(data.hasMonteur.appointmentBooked.date || ''),
                            startTime: data.hasMonteur.appointmentBooked.startTime,
                            endTime: data.hasMonteur.appointmentBooked.endTime,
                            weekNumber: data.hasMonteur.appointmentBooked.weekNumber,
                            type: data.hasMonteur.appointmentBooked.type || 'HAS',
                            hasMonteurName: data.hasMonteur.hasMonteurName || appointmentData.hasMonteurName,
                            complaintDetails: data.hasMonteur.appointmentBooked.complaintDetails || '',
                        };
                    }
                });
                setFlatAppointments(updatedFlatAppointments);
                const buildingResponse = await axiosPrivate.get<Building>(`/api/building/${id}`);
                setBuilding(buildingResponse.data);
            }

            if (failed.length === 0) {
                showSuccess('Appointments saved successfully!');
            } else if (succeeded.length > 0) {
                const conflictErrors = failed.filter(f => f.reason?.response?.status === 409);
                if (conflictErrors.length > 0) {
                    const msg = conflictErrors[0].reason?.response?.data?.message || 'Scheduling conflict detected';
                    showError(`${succeeded.length} saved, ${failed.length} failed: ${msg}`);
                } else {
                    showWarning(`Saved ${succeeded.length} of ${selectedApartments.length} appointments. ${failed.length} failed.`);
                }
            } else {
                const firstError = failed[0];
                if (firstError.reason?.response?.status === 409) {
                    const msg = firstError.reason?.response?.data?.message || 'Scheduling conflict detected';
                    showError(msg);
                } else {
                    showError('Error saving appointments. Please try again.');
                }
            }
        } catch (error) {
            logger.error('Error saving appointments:', error);
            showError('Error saving appointments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingState message="Loading building data..." />;
    if (!building) return <LoadingState message="Building not found..." />;

    const flats = building.flats || [];
    const hbNumber = generateHBNumber(building, flats);
    const buildingTitle = `${building.address}${hbNumber ? ` (${hbNumber})` : ''}`;

    return (
        <div className="ts-apartmentDetailsContainer">
            <h2>HAS Appointment Schedule for {buildingTitle}</h2>
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
                                {flat.adres} {flat.huisNummer}
                                {flat.toevoeging}
                            </label>
                            {selectedApartments.includes(flat._id) && flatAppointments[flat._id] && (
                                <div className="appointmentDetails">
                                    <div className="ts-formGroup">
                                        <label>Current Appointment:</label>
                                        <div>Type: {flatAppointments[flat._id].type}</div>
                                        <div>Date: {new Date(flatAppointments[flat._id].date).toLocaleDateString()}</div>
                                        <div>
                                            Time: {flatAppointments[flat._id].startTime} - {flatAppointments[flat._id].endTime}
                                        </div>
                                        <div>Week: {flatAppointments[flat._id].weekNumber}</div>
                                        {flatAppointments[flat._id].hasMonteurName && (
                                            <div>HAS Monteur: {flatAppointments[flat._id].hasMonteurName}</div>
                                        )}
                                        {flatAppointments[flat._id].type === 'Complaint' && flatAppointments[flat._id].complaintDetails && (
                                            <div>Complaint Details: {flatAppointments[flat._id].complaintDetails}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="ts-rightColumn">
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: '32px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <h3
                            style={{
                                color: '#1e293b',
                                fontSize: '24px',
                                fontWeight: '600',
                                margin: '0 0 24px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}
                        >
                            <span style={{ fontSize: '24px' }}>🔧</span>
                            Schedule HAS Installation
                        </h3>
                        <form onSubmit={handleAppointmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: '#374151',
                                        fontWeight: '500',
                                    }}
                                >
                                    Appointment Type
                                </label>
                                <select
                                    name="type"
                                    value={appointmentData.type}
                                    onChange={handleAppointmentChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                    }}
                                >
                                    <option value="HAS">HAS Installation</option>
                                    <option value="Storing">Storing (Service)</option>
                                    <option value="Complaint">Complaint</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: '#374151',
                                        fontWeight: '500',
                                    }}
                                >
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={appointmentData.date}
                                    onChange={handleAppointmentChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: '#374151',
                                        fontWeight: '500',
                                    }}
                                >
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={appointmentData.startTime}
                                    onChange={handleAppointmentChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: '#374151',
                                        fontWeight: '500',
                                    }}
                                >
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={appointmentData.endTime}
                                    onChange={handleAppointmentChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: '#374151',
                                        fontWeight: '500',
                                    }}
                                >
                                    HAS Monteur
                                </label>
                                <select
                                    name="hasMonteurName"
                                    value={appointmentData.hasMonteurName}
                                    onChange={handleAppointmentChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                    }}
                                >
                                    <option value="">Select HAS Monteur</option>
                                    {hasMonteurs.map((monteur) => (
                                        <option key={monteur._id} value={monteur.name}>
                                            {monteur.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {appointmentData.type === 'Complaint' && (
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            color: '#374151',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Complaint Details
                                    </label>
                                    <textarea
                                        name="complaintDetails"
                                        value={appointmentData.complaintDetails}
                                        onChange={handleAppointmentChange}
                                        placeholder="Describe the complaint..."
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '16px',
                                            minHeight: '100px',
                                        }}
                                    />
                                </div>
                            )}
                            {appointmentData.weekNumber && (
                                <div style={{ padding: '12px', background: '#e8f5e8', borderRadius: '8px' }}>
                                    <strong>Week Number:</strong> {appointmentData.weekNumber}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={selectedApartments.length === 0}
                                style={{
                                    padding: '14px 24px',
                                    background: selectedApartments.length === 0 ? '#ccc' : 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: selectedApartments.length === 0 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                Save Appointments ({selectedApartments.length} selected)
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HASPlanningApartmentSchedulePage;
