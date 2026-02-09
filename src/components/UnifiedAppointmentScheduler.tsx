// Comprehensive appointment scheduling component handling both technical and HAS planning appointments.

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { AppointmentList, AppointmentForm } from './appointment';
import '../styles/unifiedAppointmentScheduler.css';
import { useNotification } from '../context/NotificationProvider';
import logger from '../utils/logger';

interface Apartment {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    hasMonteur?: {
        appointmentBooked?: AppointmentBooked;
        hasMonteurName?: string;
    };
    technischePlanning?: {
        appointmentBooked?: AppointmentBooked;
        technischeSchouwerName?: string;
    };
}

interface AppointmentBooked {
    date?: string;
    startTime?: string;
    endTime?: string;
    weekNumber?: number;
    type?: string;
    complaintDetails?: string;
}

interface Personnel {
    _id: string;
    name: string;
    roles?: {
        HASMonteur?: number;
        TechnischeSchouwer?: number;
    };
}

interface AppointmentData {
    date: string;
    startTime: string;
    endTime: string;
    weekNumber: number | string;
    type: string;
    hasMonteurName: string;
    technischeSchouwerName: string;
    complaintDetails: string;
}

interface FlatAppointment {
    date: string;
    startTime?: string;
    endTime?: string;
    weekNumber?: number;
    type?: string;
    hasMonteurName?: string;
    technischeSchouwerName?: string;
    complaintDetails?: string;
}

interface SaveResult {
    apartmentId: string;
    data: Apartment;
}

interface UnifiedAppointmentSchedulerProps {
    apartments?: Apartment[];
    scheduleType: 'HAS' | 'TECHNICAL';
    onSaveSuccess?: (results: SaveResult[]) => void;
    onCancel?: () => void;
    preselectedApartments?: string[];
}

const UnifiedAppointmentScheduler: React.FC<UnifiedAppointmentSchedulerProps> = ({
    apartments = [],
    scheduleType,
    onSaveSuccess,
    onCancel,
    preselectedApartments = []
}) => {
    const axiosPrivate = useAxiosPrivate();
    const { showSuccess, showError, showWarning } = useNotification();
    const [loading, setLoading] = useState<boolean>(false);

    const calculateWeekNumber = (date: Date | string): number => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const [selectedApartments, setSelectedApartments] = useState<string[]>(preselectedApartments);
    const [appointmentData, setAppointmentData] = useState<AppointmentData>(() => {
        const today = new Date().toISOString().split('T')[0];
        return {
            date: today,
            startTime: '',
            endTime: '',
            weekNumber: calculateWeekNumber(today),
            type: scheduleType === 'HAS' ? 'HAS' : 'Technical',
            hasMonteurName: '',
            technischeSchouwerName: '',
            complaintDetails: ''
        };
    });
    const [availablePersonnel, setAvailablePersonnel] = useState<Personnel[]>([]);
    const [flatAppointments, setFlatAppointments] = useState<Record<string, FlatAppointment>>({});
    const isHASScheduling = scheduleType === 'HAS';
    const isSingleApartment = apartments.length === 1;

    const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const fetchAvailablePersonnel = async (): Promise<void> => {
        try {
            const response = await axiosPrivate.get<{ data: Personnel[]; pagination?: unknown } | Personnel[]>('/api/users');
            // Handle both paginated response { data: [...] } and legacy array response
            const users = Array.isArray(response.data) ? response.data : response.data.data;
            let filteredUsers: Personnel[] = [];
            if (isHASScheduling) {
                filteredUsers = users.filter(user =>
                    user.roles && typeof user.roles === 'object' &&
                    user.roles.HASMonteur === 2023
                );
            } else {
                filteredUsers = users.filter(user =>
                    user.roles && typeof user.roles === 'object' &&
                    user.roles.TechnischeSchouwer === 8687
                );
            }
            setAvailablePersonnel(filteredUsers);
        } catch (error) {
            logger.error('Error fetching personnel:', error);
        }
    };

    const loadExistingAppointments = (): void => {
        const appointments: Record<string, FlatAppointment> = {};
        apartments.forEach(apartment => {
            const apptData = isHASScheduling
                ? apartment.hasMonteur?.appointmentBooked
                : apartment.technischePlanning?.appointmentBooked;
            if (apptData?.date) {
                appointments[apartment._id] = {
                    date: formatDate(apptData.date),
                    startTime: apptData.startTime,
                    endTime: apptData.endTime,
                    weekNumber: apptData.weekNumber,
                    type: apptData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                    hasMonteurName: isHASScheduling ? apartment.hasMonteur?.hasMonteurName || '' : '',
                    technischeSchouwerName: !isHASScheduling ? apartment.technischePlanning?.technischeSchouwerName || '' : '',
                    complaintDetails: apptData.complaintDetails || ''
                };
            }
        });
        setFlatAppointments(appointments);
    };

    const loadSingleApartmentData = (): void => {
        if (apartments.length !== 1) return;
        const apartment = apartments[0];
        const apptData = isHASScheduling
            ? apartment.hasMonteur?.appointmentBooked
            : apartment.technischePlanning?.appointmentBooked;
        if (apptData && apptData.date) {
            setAppointmentData({
                date: formatDate(apptData.date),
                startTime: apptData.startTime || '',
                endTime: apptData.endTime || '',
                weekNumber: apptData.weekNumber || calculateWeekNumber(apptData.date),
                type: apptData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                hasMonteurName: isHASScheduling ? apartment.hasMonteur?.hasMonteurName || '' : '',
                technischeSchouwerName: !isHASScheduling ? apartment.technischePlanning?.technischeSchouwerName || '' : '',
                complaintDetails: apptData.complaintDetails || ''
            });
        } else {
            const today = new Date().toISOString().split('T')[0];
            setAppointmentData({
                date: today,
                startTime: '',
                endTime: '',
                weekNumber: calculateWeekNumber(today),
                type: isHASScheduling ? 'HAS' : 'Technical',
                hasMonteurName: isHASScheduling ? apartment.hasMonteur?.hasMonteurName || '' : '',
                technischeSchouwerName: !isHASScheduling ? apartment.technischePlanning?.technischeSchouwerName || '' : '',
                complaintDetails: ''
            });
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchAvailablePersonnel();
        loadExistingAppointments();
        if (isSingleApartment) {
            setSelectedApartments([apartments[0]._id]);
            loadSingleApartmentData();
        } else {
            const apartmentsWithAppointments = apartments.filter(apartment => {
                const apptData = isHASScheduling
                    ? apartment.hasMonteur?.appointmentBooked
                    : apartment.technischePlanning?.appointmentBooked;
                return apptData?.date;
            }).map(apartment => apartment._id);
            const combinedPreselected = [...new Set([...preselectedApartments, ...apartmentsWithAppointments])];
            setSelectedApartments(combinedPreselected);
            if (combinedPreselected.length === 1) {
                const selectedApartment = apartments.find(apt => apt._id === combinedPreselected[0]);
                if (selectedApartment) {
                    const apptData = isHASScheduling
                        ? selectedApartment.hasMonteur?.appointmentBooked
                        : selectedApartment.technischePlanning?.appointmentBooked;
                    if (apptData?.date) {
                        setAppointmentData({
                            date: formatDate(apptData.date),
                            startTime: apptData.startTime || '',
                            endTime: apptData.endTime || '',
                            weekNumber: apptData.weekNumber || calculateWeekNumber(apptData.date),
                            type: apptData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                            hasMonteurName: isHASScheduling ? selectedApartment.hasMonteur?.hasMonteurName || '' : '',
                            technischeSchouwerName: !isHASScheduling ? selectedApartment.technischePlanning?.technischeSchouwerName || '' : '',
                            complaintDetails: apptData.complaintDetails || ''
                        });
                    }
                }
            }
        }
    }, [apartments, scheduleType, preselectedApartments, isHASScheduling]);

    const handleApartmentSelection = (apartmentId: string): void => {
        if (isSingleApartment) return;
        const newSelectedApartments = selectedApartments.includes(apartmentId)
            ? selectedApartments.filter(id => id !== apartmentId)
            : [...selectedApartments, apartmentId];
        setSelectedApartments(newSelectedApartments);
        if (newSelectedApartments.length === 1 && flatAppointments[apartmentId]) {
            const existingAppointment = flatAppointments[apartmentId];
            setAppointmentData({
                date: existingAppointment.date,
                startTime: existingAppointment.startTime || '',
                endTime: existingAppointment.endTime || '',
                weekNumber: existingAppointment.weekNumber || '',
                type: existingAppointment.type || '',
                hasMonteurName: existingAppointment.hasMonteurName || '',
                technischeSchouwerName: existingAppointment.technischeSchouwerName || '',
                complaintDetails: existingAppointment.complaintDetails || ''
            });
        } else if (newSelectedApartments.length !== 1) {
            const today = new Date().toISOString().split('T')[0];
            setAppointmentData({
                date: today,
                startTime: '',
                endTime: '',
                weekNumber: calculateWeekNumber(today),
                type: isHASScheduling ? 'HAS' : 'Technical',
                hasMonteurName: '',
                technischeSchouwerName: '',
                complaintDetails: ''
            });
        }
    };

    const handleAppointmentChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setAppointmentData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'date' ? { weekNumber: calculateWeekNumber(value) } : {})
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (selectedApartments.length === 0) {
            showWarning('Please select at least one apartment.');
            return;
        }

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
                selectedApartments.map(async (apartmentId) => {
                    const payload: {
                        appointmentBooked: {
                            date: string;
                            startTime: string;
                            endTime: string;
                            weekNumber: number | string;
                            type?: string;
                            complaintDetails?: string;
                        };
                        hasMonteurName?: string;
                        technischeSchouwerName?: string;
                    } = isHASScheduling ? {
                        appointmentBooked: {
                            date: appointmentData.date,
                            startTime: appointmentData.startTime,
                            endTime: appointmentData.endTime,
                            weekNumber: appointmentData.weekNumber,
                            type: appointmentData.type
                        },
                        hasMonteurName: appointmentData.hasMonteurName
                    } : {
                        appointmentBooked: {
                            date: appointmentData.date,
                            startTime: appointmentData.startTime,
                            endTime: appointmentData.endTime,
                            weekNumber: appointmentData.weekNumber
                        },
                        technischeSchouwerName: appointmentData.technischeSchouwerName
                    };
                    if (isHASScheduling && appointmentData.type === 'Complaint' && appointmentData.complaintDetails) {
                        payload.appointmentBooked.complaintDetails = appointmentData.complaintDetails;
                    }
                    const endpoint = isHASScheduling
                        ? `/api/apartment/${apartmentId}/has-monteur`
                        : `/api/apartment/${apartmentId}/technische-planning`;
                    const response = await axiosPrivate.put<Apartment>(endpoint, payload);
                    return { apartmentId, data: response.data };
                })
            );

            const successful = results.filter((r): r is PromiseFulfilledResult<SaveResult> => r.status === 'fulfilled').map(r => r.value);
            const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

            // Update state with successful appointments
            const updatedAppointments = { ...flatAppointments };
            successful.forEach(({ apartmentId, data }) => {
                const apptData = isHASScheduling
                    ? data.hasMonteur?.appointmentBooked
                    : data.technischePlanning?.appointmentBooked;
                if (apptData) {
                    updatedAppointments[apartmentId] = {
                        date: formatDate(apptData.date || ''),
                        startTime: apptData.startTime,
                        endTime: apptData.endTime,
                        weekNumber: apptData.weekNumber,
                        type: apptData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                        hasMonteurName: isHASScheduling ? data.hasMonteur?.hasMonteurName || '' : '',
                        technischeSchouwerName: !isHASScheduling ? data.technischePlanning?.technischeSchouwerName || '' : '',
                        complaintDetails: apptData.complaintDetails || ''
                    };
                }
            });
            setFlatAppointments(updatedAppointments);

            if (failed.length === 0) {
                if (onSaveSuccess) {
                    onSaveSuccess(successful);
                }
                showSuccess(`${isHASScheduling ? 'HAS' : 'Technical Planning'} appointments saved successfully!`);
            } else if (successful.length > 0) {
                logger.error('Some appointments failed:', failed.map(f => f.reason));
                const conflictErrors = failed.filter(f => f.reason?.response?.status === 409);
                if (conflictErrors.length > 0) {
                    const msg = conflictErrors[0].reason?.response?.data?.message || 'Scheduling conflict detected';
                    showError(`${successful.length} saved, ${failed.length} failed: ${msg}`);
                } else {
                    showWarning(`Saved ${successful.length} of ${selectedApartments.length} appointments. ${failed.length} failed.`);
                }
                if (onSaveSuccess) {
                    onSaveSuccess(successful);
                }
            } else {
                const firstError = failed[0];
                if (firstError?.reason?.response?.status === 409) {
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

    return (
        <div className="usc-container">
            <div className="usc-columns">
                <div className="usc-leftColumn">
                    <AppointmentList
                        apartments={apartments}
                        selectedApartments={selectedApartments}
                        flatAppointments={flatAppointments}
                        isHASScheduling={isHASScheduling}
                        onApartmentSelect={handleApartmentSelection}
                        isSingleApartment={isSingleApartment}
                    />
                </div>
                <div className="usc-rightColumn">
                    <AppointmentForm
                        appointmentData={appointmentData}
                        onAppointmentChange={handleAppointmentChange}
                        onSubmit={handleSubmit}
                        onCancel={onCancel}
                        availablePersonnel={availablePersonnel}
                        isHASScheduling={isHASScheduling}
                        loading={loading}
                        canSubmit={selectedApartments.length > 0}
                    />
                </div>
            </div>
        </div>
    );
};

export default UnifiedAppointmentScheduler;
