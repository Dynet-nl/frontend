// Unified appointment scheduling page handling both technical and HAS planning appointment types.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import logger from '../utils/logger';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import UnifiedAppointmentScheduler from '../components/UnifiedAppointmentScheduler';
import { ROLES } from '../utils/constants';

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

interface AppointmentData {
    _id: string;
    date?: string;
    time?: string;
}

const UnifiedAppointmentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();

    const [loading, setLoading] = useState<boolean>(true);
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [scheduleType, setScheduleType] = useState<string>('');
    const [pageTitle, setPageTitle] = useState<string>('');

    const mode = searchParams.get('mode') || 'single';
    const type = searchParams.get('type') || '';

    useEffect(() => {
        determineScheduleTypeAndFetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, mode, type, auth]);

    const determineScheduleTypeAndFetchData = async (): Promise<void> => {
        setLoading(true);
        try {
            let determinedType = type;
            if (!determinedType) {
                if (auth?.roles?.includes(ROLES.HAS_PLANNING)) {
                    determinedType = 'HAS';
                } else if (auth?.roles?.includes(ROLES.TECHNICAL_PLANNING)) {
                    determinedType = 'Technical';
                } else {
                    throw new Error('User does not have permission to schedule appointments');
                }
            }
            setScheduleType(determinedType);

            if (mode === 'building') {
                await fetchBuildingData(determinedType);
            } else {
                await fetchSingleApartmentData(determinedType);
            }
        } catch (error) {
            logger.error('Error determining schedule type or fetching data:', error);
            alert('Error loading appointment data. Please try again.');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const fetchBuildingData = async (schedType: string): Promise<void> => {
        try {
            const response = await axiosPrivate.get<Building>(`/api/building/${id}`);
            const buildingData = response.data;
            setApartments(buildingData.flats || []);
            setPageTitle(`${schedType} Appointment Scheduling - ${buildingData.address || 'Building'}`);
        } catch (error) {
            logger.error('Error fetching building data:', error);
            throw error;
        }
    };

    const fetchSingleApartmentData = async (schedType: string): Promise<void> => {
        try {
            const response = await axiosPrivate.get<Apartment>(`/api/apartment/${id}`);
            const apartmentData = response.data;
            setApartments([apartmentData]);
            setPageTitle(
                `${schedType} Appointment Scheduling - ${apartmentData.adres} ${apartmentData.huisNummer}${apartmentData.toevoeging}`
            );
        } catch (error) {
            logger.error('Error fetching apartment data:', error);
            throw error;
        }
    };

    const handleSaveSuccess = (_appointments: AppointmentData[]): void => {
        if (mode === 'single' && apartments[0]) {
            const apartmentId = apartments[0].apartmentId || apartments[0]._id;
            if (scheduleType === 'HAS') {
                navigate(`/has-planning-apartment/${apartmentId}`);
            } else {
                navigate(`/planning-apartment/${apartmentId}`);
            }
        }
    };

    const handleCancel = (): void => {
        navigate(-1);
    };

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

    const preselectedApartments = mode === 'single' ? [apartments[0]._id] : [];

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
