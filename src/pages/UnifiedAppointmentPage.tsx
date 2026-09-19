// Unified appointment scheduling page handling both technical and HAS planning appointment types.

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import logger from '../utils/logger';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import UnifiedAppointmentScheduler from '../components/UnifiedAppointmentScheduler';
import { ROLES } from '../utils/constants';
import { useNotification } from '../context/NotificationProvider';

interface Apartment {
    _id: string;
    apartmentId?: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
}

interface Building {
    _id: string;
    address?: string;
    flats?: Apartment[];
}

type ScheduleType = 'HAS' | 'TECHNICAL';

const UnifiedAppointmentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const { showError } = useNotification();

    const [loading, setLoading] = useState<boolean>(true);
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [scheduleType, setScheduleType] = useState<ScheduleType>('TECHNICAL');
    const [pageTitle, setPageTitle] = useState<string>('');

    const mode = searchParams.get('mode') || 'single';
    const type = searchParams.get('type') || '';
    const roles = auth?.roles ?? [];
    const rolesKey = roles.join(',');
    const isAdmin = roles.includes(ROLES.ADMIN);

    useEffect(() => {
        determineScheduleTypeAndFetchData();
        // Re-run only when the target or the user's roles change, not on every auth object identity change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, mode, type, rolesKey]);

    const determineScheduleTypeAndFetchData = async (): Promise<void> => {
        setLoading(true);
        try {
            let determinedType: ScheduleType;
            if (type) {
                determinedType = type.toUpperCase() === 'HAS' ? 'HAS' : 'TECHNICAL';
            } else if (roles.includes(ROLES.HAS_PLANNING)) {
                determinedType = 'HAS';
            } else if (roles.includes(ROLES.TECHNICAL_PLANNING) || roles.includes(ROLES.WERKVOORBEREIDER) || isAdmin) {
                determinedType = 'TECHNICAL';
            } else {
                throw new Error('User does not have permission to schedule appointments');
            }
            setScheduleType(determinedType);

            if (mode === 'building') {
                await fetchBuildingData(determinedType);
            } else {
                await fetchSingleApartmentData(determinedType);
            }
        } catch (error) {
            logger.error('Error determining schedule type or fetching data:', error);
            showError('Error loading appointment data. Please try again.');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const fetchBuildingData = async (schedType: ScheduleType): Promise<void> => {
        try {
            const response = await axiosPrivate.get<Building>(`/api/building/${id}`);
            const buildingData = response.data;
            setApartments(buildingData.flats || []);
            setPageTitle(`${schedType === 'HAS' ? 'HAS' : 'Technical'} Appointment Scheduling - ${buildingData.address || 'Building'}`);
        } catch (error) {
            logger.error('Error fetching building data:', error);
            throw error;
        }
    };

    const fetchSingleApartmentData = async (schedType: ScheduleType): Promise<void> => {
        try {
            const response = await axiosPrivate.get<Apartment>(`/api/apartment/${id}`);
            const apartmentData = response.data;
            setApartments([apartmentData]);
            setPageTitle(
                `${schedType === 'HAS' ? 'HAS' : 'Technical'} Appointment Scheduling - ${apartmentData.adres} ${apartmentData.huisNummer}${apartmentData.toevoeging || ''}`
            );
        } catch (error) {
            logger.error('Error fetching apartment data:', error);
            throw error;
        }
    };

    const handleSaveSuccess = (): void => {
        if (mode === 'single' && apartments[0]) {
            const apartmentId = apartments[0].apartmentId || apartments[0]._id;
            if (isAdmin) {
                navigate(`/admin-apartment/${apartmentId}`);
            } else if (scheduleType === 'HAS') {
                navigate(`/has-planning-apartment/${apartmentId}`);
            } else {
                navigate(`/planning-apartment/${apartmentId}`);
            }
        }
    };

    const handleCancel = (): void => {
        navigate(-1);
    };

    // Stable identity: the scheduler resets its selection when this array changes.
    // Declared before the early returns below so the hook order never changes.
    const preselectedApartments = useMemo(() => (mode === 'single' && apartments[0] ? [apartments[0]._id] : []), [mode, apartments]);

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                    fontSize: '18px',
                    color: '#666',
                }}
            >
                Loading appointment data...
            </div>
        );
    }

    if (!apartments.length) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                    fontSize: '18px',
                    color: '#666',
                }}
            >
                No apartments found for scheduling.
            </div>
        );
    }


    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h1
                    style={{
                        color: '#2c3e50',
                        marginBottom: '10px',
                        fontSize: '2rem',
                        fontWeight: '600',
                    }}
                >
                    {pageTitle}
                </h1>
                <div
                    style={{
                        color: '#7f8c8d',
                        fontSize: '1rem',
                        fontWeight: '500',
                    }}
                >
                    {mode === 'building'
                        ? `Select apartments and set appointment details for ${scheduleType} scheduling`
                        : `Set appointment details for this apartment`}
                </div>
            </div>
            <UnifiedAppointmentScheduler
                apartments={apartments}
                scheduleType={scheduleType}
                onSaveSuccess={handleSaveSuccess}
                onCancel={handleCancel}
                preselectedApartments={preselectedApartments}
            />
        </div>
    );
};

export default UnifiedAppointmentPage;
