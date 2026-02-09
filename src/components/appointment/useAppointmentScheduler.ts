import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import logger from '../../utils/logger';

interface Apartment {
    _id: string;
    hasAppointment?: {
        date?: string;
        startTime?: string;
        endTime?: string;
        weekNumber?: number;
        hasMonteurName?: string;
    };
    technischeSchouw?: {
        date?: string;
        startTime?: string;
        endTime?: string;
        weekNumber?: number;
        technischeSchouwerName?: string;
    };
}

interface Personnel {
    _id: string;
    name: string;
}

interface AppointmentData {
    date: string;
    startTime: string;
    endTime: string;
    weekNumber: number | string;
    technischeSchouwerName: string;
    hasMonteurName: string;
    type?: string;
    complaintDetails?: string;
}

interface FlatAppointment {
    date: string;
    startTime?: string;
    endTime?: string;
    weekNumber?: number;
    hasMonteurName?: string;
    technischeSchouwerName?: string;
    type?: string;
}

interface UseAppointmentSchedulerOptions {
    apartments?: Apartment[];
    scheduleType: 'HAS' | 'TECHNICAL';
    onSaveSuccess?: (apartmentIds: string[]) => void;
    preselectedApartments?: string[];
}

interface UseAppointmentSchedulerReturn {
    loading: boolean;
    selectedApartments: string[];
    appointmentData: AppointmentData;
    availablePersonnel: Personnel[];
    flatAppointments: Record<string, FlatAppointment>;
    isHASScheduling: boolean;
    handleApartmentSelection: (apartmentId: string) => void;
    handleAppointmentChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
    selectAll: () => void;
    deselectAll: () => void;
}

/**
 * Calculate week number from a date
 */
const calculateWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Custom hook for appointment scheduling logic
 */
const useAppointmentScheduler = ({
    apartments = [],
    scheduleType,
    onSaveSuccess,
    preselectedApartments = []
}: UseAppointmentSchedulerOptions): UseAppointmentSchedulerReturn => {
    const axiosPrivate = useAxiosPrivate();
    const isHASScheduling = scheduleType === 'HAS';

    // State
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedApartments, setSelectedApartments] = useState<string[]>([]);
    const [appointmentData, setAppointmentData] = useState<AppointmentData>({
        date: '',
        startTime: '',
        endTime: '',
        weekNumber: '',
        technischeSchouwerName: '',
        hasMonteurName: ''
    });
    const [availablePersonnel, setAvailablePersonnel] = useState<Personnel[]>([]);
    const [flatAppointments, setFlatAppointments] = useState<Record<string, FlatAppointment>>({});

    /**
     * Fetch available personnel based on schedule type
     */
    const fetchAvailablePersonnel = useCallback(async (): Promise<void> => {
        try {
            const endpoint = isHASScheduling ? '/has-monteurs' : '/users/technische-schouwers';
            const response = await axiosPrivate.get<Personnel[]>(endpoint);
            setAvailablePersonnel(response.data);
        } catch (error) {
            logger.error('Error fetching available personnel:', error);
            setAvailablePersonnel([]);
        }
    }, [axiosPrivate, isHASScheduling]);

    /**
     * Load existing appointments for selected apartments
     */
    const loadExistingAppointments = useCallback(async (apartmentIds: string[]): Promise<void> => {
        if (!apartmentIds.length) return;

        try {
            const appointmentsMap: Record<string, FlatAppointment> = {};
            for (const id of apartmentIds) {
                const response = await axiosPrivate.get<Apartment>(`/apartments/${id}`);
                const apt = response.data;

                if (isHASScheduling && apt.hasAppointment) {
                    appointmentsMap[id] = {
                        date: apt.hasAppointment.date?.split('T')[0] || '',
                        startTime: apt.hasAppointment.startTime || '',
                        endTime: apt.hasAppointment.endTime || '',
                        hasMonteurName: apt.hasAppointment.hasMonteurName || ''
                    };
                } else if (!isHASScheduling && apt.technischeSchouw) {
                    appointmentsMap[id] = {
                        date: apt.technischeSchouw.date?.split('T')[0] || '',
                        startTime: apt.technischeSchouw.startTime || '',
                        endTime: apt.technischeSchouw.endTime || '',
                        technischeSchouwerName: apt.technischeSchouw.technischeSchouwerName || ''
                    };
                }
            }
            setFlatAppointments(appointmentsMap);
        } catch (error) {
            logger.error('Error loading existing appointments:', error);
        }
    }, [axiosPrivate, isHASScheduling]);

    /**
     * Load data for a single apartment
     */
    const loadSingleApartmentData = useCallback(async (apartmentId: string): Promise<void> => {
        try {
            const response = await axiosPrivate.get<Apartment>(`/apartments/${apartmentId}`);
            const apt = response.data;

            if (isHASScheduling && apt.hasAppointment) {
                setAppointmentData({
                    date: apt.hasAppointment.date?.split('T')[0] || '',
                    startTime: apt.hasAppointment.startTime || '',
                    endTime: apt.hasAppointment.endTime || '',
                    weekNumber: apt.hasAppointment.date ?
                        calculateWeekNumber(new Date(apt.hasAppointment.date)) : '',
                    hasMonteurName: apt.hasAppointment.hasMonteurName || '',
                    technischeSchouwerName: ''
                });
            } else if (!isHASScheduling && apt.technischeSchouw) {
                setAppointmentData({
                    date: apt.technischeSchouw.date?.split('T')[0] || '',
                    startTime: apt.technischeSchouw.startTime || '',
                    endTime: apt.technischeSchouw.endTime || '',
                    weekNumber: apt.technischeSchouw.date ?
                        calculateWeekNumber(new Date(apt.technischeSchouw.date)) : '',
                    technischeSchouwerName: apt.technischeSchouw.technischeSchouwerName || '',
                    hasMonteurName: ''
                });
            }
        } catch (error) {
            logger.error('Error loading apartment data:', error);
        }
    }, [axiosPrivate, isHASScheduling]);

    /**
     * Handle apartment selection toggle
     */
    const handleApartmentSelection = useCallback((apartmentId: string): void => {
        setSelectedApartments(prev => {
            const isSelected = prev.includes(apartmentId);
            const newSelection = isSelected
                ? prev.filter(id => id !== apartmentId)
                : [...prev, apartmentId];

            // Load appointment data if selecting a single apartment
            if (!isSelected && newSelection.length === 1) {
                loadSingleApartmentData(apartmentId);
            }

            return newSelection;
        });
    }, [loadSingleApartmentData]);

    /**
     * Handle appointment form field changes
     */
    const handleAppointmentChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setAppointmentData(prev => {
            const updated = { ...prev, [name]: value };

            // Auto-calculate week number when date changes
            if (name === 'date' && value) {
                updated.weekNumber = calculateWeekNumber(new Date(value));
            }

            return updated;
        });
    }, []);

    /**
     * Handle form submission
     */
    const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!selectedApartments.length) {
            logger.warn('No apartments selected for scheduling');
            return;
        }

        setLoading(true);
        try {
            const updatePromises = selectedApartments.map(apartmentId => {
                const payload = isHASScheduling
                    ? {
                        hasAppointment: {
                            date: appointmentData.date,
                            startTime: appointmentData.startTime,
                            endTime: appointmentData.endTime,
                            weekNumber: appointmentData.weekNumber,
                            hasMonteurName: appointmentData.hasMonteurName
                        }
                    }
                    : {
                        technischeSchouw: {
                            date: appointmentData.date,
                            startTime: appointmentData.startTime,
                            endTime: appointmentData.endTime,
                            weekNumber: appointmentData.weekNumber,
                            technischeSchouwerName: appointmentData.technischeSchouwerName
                        }
                    };

                return axiosPrivate.put(`/apartments/${apartmentId}`, payload);
            });

            await Promise.all(updatePromises);
            logger.log(`Successfully scheduled ${selectedApartments.length} appointments`);

            if (onSaveSuccess) {
                onSaveSuccess(selectedApartments);
            }

            // Reset form
            setSelectedApartments([]);
            setAppointmentData({
                date: '',
                startTime: '',
                endTime: '',
                weekNumber: '',
                technischeSchouwerName: '',
                hasMonteurName: ''
            });
        } catch (error) {
            logger.error('Error saving appointments:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedApartments, appointmentData, isHASScheduling, axiosPrivate, onSaveSuccess]);

    /**
     * Select all apartments
     */
    const selectAll = useCallback((): void => {
        setSelectedApartments(apartments.map(apt => apt._id));
    }, [apartments]);

    /**
     * Deselect all apartments
     */
    const deselectAll = useCallback((): void => {
        setSelectedApartments([]);
    }, []);

    // Initial data loading
    useEffect(() => {
        fetchAvailablePersonnel();
    }, [fetchAvailablePersonnel]);

    // Load existing appointments when apartments change
    useEffect(() => {
        if (apartments.length) {
            loadExistingAppointments(apartments.map(apt => apt._id));
        }
    }, [apartments, loadExistingAppointments]);

    // Handle preselected apartments
    useEffect(() => {
        if (preselectedApartments.length) {
            setSelectedApartments(preselectedApartments);
            if (preselectedApartments.length === 1) {
                loadSingleApartmentData(preselectedApartments[0]);
            }
        }
    }, [preselectedApartments, loadSingleApartmentData]);

    return {
        // State
        loading,
        selectedApartments,
        appointmentData,
        availablePersonnel,
        flatAppointments,
        isHASScheduling,

        // Handlers
        handleApartmentSelection,
        handleAppointmentChange,
        handleSubmit,
        selectAll,
        deselectAll
    };
};

export default useAppointmentScheduler;
