import { useState, useEffect, useCallback } from 'react';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import logger from '../../utils/logger';

/**
 * Calculate week number from a date
 * @param {Date} date - The date to calculate week number for
 * @returns {number} The week number (1-52)
 */
const calculateWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Custom hook for appointment scheduling logic
 * @param {Object} options - Hook options
 * @param {Array} options.apartments - List of apartments to schedule
 * @param {string} options.scheduleType - Type of schedule ('HAS' or 'TECHNICAL')
 * @param {Function} options.onSaveSuccess - Callback when save succeeds
 * @param {Array} options.preselectedApartments - Pre-selected apartment IDs
 * @returns {Object} Appointment scheduling state and handlers
 */
const useAppointmentScheduler = ({
    apartments = [],
    scheduleType,
    onSaveSuccess,
    preselectedApartments = []
}) => {
    const axiosPrivate = useAxiosPrivate();
    const isHASScheduling = scheduleType === 'HAS';

    // State
    const [loading, setLoading] = useState(false);
    const [selectedApartments, setSelectedApartments] = useState([]);
    const [appointmentData, setAppointmentData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        weekNumber: '',
        technischeSchouwerName: '',
        hasMonteurName: ''
    });
    const [availablePersonnel, setAvailablePersonnel] = useState([]);
    const [flatAppointments, setFlatAppointments] = useState({});

    /**
     * Fetch available personnel based on schedule type
     */
    const fetchAvailablePersonnel = useCallback(async () => {
        try {
            const endpoint = isHASScheduling ? '/has-monteurs' : '/users/technische-schouwers';
            const response = await axiosPrivate.get(endpoint);
            setAvailablePersonnel(response.data);
        } catch (error) {
            logger.error('Error fetching available personnel:', error);
            setAvailablePersonnel([]);
        }
    }, [axiosPrivate, isHASScheduling]);

    /**
     * Load existing appointments for selected apartments
     */
    const loadExistingAppointments = useCallback(async (apartmentIds) => {
        if (!apartmentIds.length) return;
        
        try {
            const appointmentsMap = {};
            for (const id of apartmentIds) {
                const response = await axiosPrivate.get(`/apartments/${id}`);
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
    const loadSingleApartmentData = useCallback(async (apartmentId) => {
        try {
            const response = await axiosPrivate.get(`/apartments/${apartmentId}`);
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
    const handleApartmentSelection = useCallback((apartmentId) => {
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
    const handleAppointmentChange = useCallback((e) => {
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
    const handleSubmit = useCallback(async (e) => {
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
    const selectAll = useCallback(() => {
        setSelectedApartments(apartments.map(apt => apt._id));
    }, [apartments]);

    /**
     * Deselect all apartments
     */
    const deselectAll = useCallback(() => {
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
