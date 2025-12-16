// Comprehensive appointment scheduling component handling both technical and HAS planning appointments.

import React, { useState, useEffect } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { AppointmentList, AppointmentForm } from './appointment';
import '../styles/unifiedAppointmentScheduler.css';
import logger from '../utils/logger';

const UnifiedAppointmentScheduler = ({
    apartments = [],
    scheduleType,
    onSaveSuccess,
    onCancel,
    preselectedApartments = []
}) => {
    const axiosPrivate = useAxiosPrivate();
    const [loading, setLoading] = useState(false);
    const calculateWeekNumber = (date) => {
        const currentDate = new Date(date);
        const firstJan = new Date(currentDate.getFullYear(), 0, 1);
        const days = Math.floor((currentDate - firstJan) / (24 * 60 * 60 * 1000));
        return Math.ceil((currentDate.getDay() + 1 + days) / 7);
    };

    const [selectedApartments, setSelectedApartments] = useState(preselectedApartments);
    const [appointmentData, setAppointmentData] = useState(() => {
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
    const [availablePersonnel, setAvailablePersonnel] = useState([]);
    const [flatAppointments, setFlatAppointments] = useState({});
    const isHASScheduling = scheduleType === 'HAS';
    const isSingleApartment = apartments.length === 1;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
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
                const appointmentData = isHASScheduling 
                    ? apartment.hasMonteur?.appointmentBooked
                    : apartment.technischePlanning?.appointmentBooked;
                return appointmentData?.date;
            }).map(apartment => apartment._id);
            const combinedPreselected = [...new Set([...preselectedApartments, ...apartmentsWithAppointments])];
            setSelectedApartments(combinedPreselected);
            if (combinedPreselected.length === 1) {
                const selectedApartment = apartments.find(apt => apt._id === combinedPreselected[0]);
                if (selectedApartment) {
                    const appointmentData = isHASScheduling 
                        ? selectedApartment.hasMonteur?.appointmentBooked
                        : selectedApartment.technischePlanning?.appointmentBooked;
                    if (appointmentData?.date) {
                        setAppointmentData({
                            date: formatDate(appointmentData.date),
                            startTime: appointmentData.startTime || '',
                            endTime: appointmentData.endTime || '',
                            weekNumber: appointmentData.weekNumber || calculateWeekNumber(appointmentData.date),
                            type: appointmentData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                            hasMonteurName: isHASScheduling ? selectedApartment.hasMonteur?.hasMonteurName || '' : '',
                            technischeSchouwerName: !isHASScheduling ? selectedApartment.technischePlanning?.technischeSchouwerName || '' : '',
                            complaintDetails: appointmentData.complaintDetails || ''
                        });
                    }
                }
            }
        }
    }, [apartments, scheduleType, preselectedApartments, isHASScheduling]);
    const fetchAvailablePersonnel = async () => {
        try {
            const response = await axiosPrivate.get('/api/users');
            const users = response.data;
            let filteredUsers = [];
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
    const loadExistingAppointments = () => {
        const appointments = {};
        apartments.forEach(apartment => {
            const appointmentData = isHASScheduling 
                ? apartment.hasMonteur?.appointmentBooked
                : apartment.technischePlanning?.appointmentBooked;
            if (appointmentData?.date) {
                appointments[apartment._id] = {
                    date: formatDate(appointmentData.date),
                    startTime: appointmentData.startTime,
                    endTime: appointmentData.endTime,
                    weekNumber: appointmentData.weekNumber,
                    type: appointmentData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                    hasMonteurName: isHASScheduling ? apartment.hasMonteur?.hasMonteurName || '' : '',
                    technischeSchouwerName: !isHASScheduling ? apartment.technischePlanning?.technischeSchouwerName || '' : '',
                    complaintDetails: appointmentData.complaintDetails || ''
                };
            }
        });
        setFlatAppointments(appointments);
    };
    const loadSingleApartmentData = () => {
        if (apartments.length !== 1) return;
        const apartment = apartments[0];
        const appointmentData = isHASScheduling 
            ? apartment.hasMonteur?.appointmentBooked
            : apartment.technischePlanning?.appointmentBooked;
        if (appointmentData && appointmentData.date) {
            setAppointmentData({
                date: formatDate(appointmentData.date),
                startTime: appointmentData.startTime || '',
                endTime: appointmentData.endTime || '',
                weekNumber: appointmentData.weekNumber || calculateWeekNumber(appointmentData.date),
                type: appointmentData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                hasMonteurName: isHASScheduling ? apartment.hasMonteur?.hasMonteurName || '' : '',
                technischeSchouwerName: !isHASScheduling ? apartment.technischePlanning?.technischeSchouwerName || '' : '',
                complaintDetails: appointmentData.complaintDetails || ''
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
    const handleApartmentSelection = (apartmentId) => {
        if (isSingleApartment) return;
        const newSelectedApartments = selectedApartments.includes(apartmentId) 
            ? selectedApartments.filter(id => id !== apartmentId)
            : [...selectedApartments, apartmentId];
        setSelectedApartments(newSelectedApartments);
        if (newSelectedApartments.length === 1 && flatAppointments[apartmentId]) {
            const existingAppointment = flatAppointments[apartmentId];
            setAppointmentData({
                date: existingAppointment.date,
                startTime: existingAppointment.startTime,
                endTime: existingAppointment.endTime,
                weekNumber: existingAppointment.weekNumber,
                type: existingAppointment.type,
                hasMonteurName: existingAppointment.hasMonteurName,
                technischeSchouwerName: existingAppointment.technischeSchouwerName,
                complaintDetails: existingAppointment.complaintDetails
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
    const handleAppointmentChange = (e) => {
        const { name, value } = e.target;
        setAppointmentData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'date' ? { weekNumber: calculateWeekNumber(value) } : {})
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedApartments.length === 0) {
            alert('Please select at least one apartment.');
            return;
        }
        setLoading(true);
        try {
            const appointments = await Promise.all(
                selectedApartments.map(async (apartmentId) => {
                    const appointmentPayload = isHASScheduling ? {
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
                        appointmentPayload.appointmentBooked.complaintDetails = appointmentData.complaintDetails;
                    }
                    const endpoint = isHASScheduling 
                        ? `/api/apartment/${apartmentId}/has-monteur`
                        : `/api/apartment/${apartmentId}/technische-planning`;
                    const response = await axiosPrivate.put(endpoint, appointmentPayload);
                    return { apartmentId, data: response.data };
                })
            );
            const updatedAppointments = { ...flatAppointments };
            appointments.forEach(({ apartmentId, data }) => {
                const appointmentData = isHASScheduling 
                    ? data.hasMonteur?.appointmentBooked
                    : data.technischePlanning?.appointmentBooked;
                if (appointmentData) {
                    updatedAppointments[apartmentId] = {
                        date: formatDate(appointmentData.date),
                        startTime: appointmentData.startTime,
                        endTime: appointmentData.endTime,
                        weekNumber: appointmentData.weekNumber,
                        type: appointmentData.type || (isHASScheduling ? 'HAS' : 'Technical'),
                        hasMonteurName: isHASScheduling ? data.hasMonteur?.hasMonteurName || '' : '',
                        technischeSchouwerName: !isHASScheduling ? data.technischePlanning?.technischeSchouwerName || '' : '',
                        complaintDetails: appointmentData.complaintDetails || ''
                    };
                }
            });
            setFlatAppointments(updatedAppointments);
            if (onSaveSuccess) {
                onSaveSuccess(appointments);
            }
            alert(`${isHASScheduling ? 'HAS' : 'Technical Planning'} appointments saved successfully!`);
        } catch (error) {
            logger.error('Error saving appointments:', error);
            alert('Error saving appointments. Please try again.');
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
