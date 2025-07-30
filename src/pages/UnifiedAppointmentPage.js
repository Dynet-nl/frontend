// Unified appointment scheduling page handling both technical and HAS planning appointment types.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import UnifiedAppointmentScheduler from '../components/UnifiedAppointmentScheduler';
import ROLES_LIST from '../context/roles_list';
const UnifiedAppointmentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const [loading, setLoading] = useState(true);
    const [apartments, setApartments] = useState([]);
    const [scheduleType, setScheduleType] = useState('');
    const [pageTitle, setPageTitle] = useState('');
    const mode = searchParams.get('mode') || 'single';
    const type = searchParams.get('type') || '';
    useEffect(() => {
        determineScheduleTypeAndFetchData();
    }, [id, mode, type, auth]);
    const determineScheduleTypeAndFetchData = async () => {
        setLoading(true);
        try {
            let determinedType = type;
            if (!determinedType) {
                if (auth?.roles?.includes(ROLES_LIST.HASPlanning)) {
                    determinedType = 'HAS';
                } else if (auth?.roles?.includes(ROLES_LIST.TechnischePlanning)) {
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
            console.error('Error determining schedule type or fetching data:', error);
            alert('Error loading appointment data. Please try again.');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };
    const fetchBuildingData = async (type) => {
        try {
            const response = await axiosPrivate.get(`/api/building/${id}`);
            const buildingData = response.data;
            setApartments(buildingData.flats || []);
            setPageTitle(`${type} Appointment Scheduling - ${buildingData.address || 'Building'}`);
        } catch (error) {
            console.error('Error fetching building data:', error);
            throw error;
        }
    };
    const fetchSingleApartmentData = async (type) => {
        try {
            const response = await axiosPrivate.get(`/api/apartment/${id}`);
            const apartmentData = response.data;
            setApartments([apartmentData]);
            setPageTitle(`${type} Appointment Scheduling - ${apartmentData.adres} ${apartmentData.huisNummer}${apartmentData.toevoeging}`);
        } catch (error) {
            console.error('Error fetching apartment data:', error);
            throw error;
        }
    };
    const handleSaveSuccess = (appointments) => {
        console.log('Appointments saved successfully:', appointments);
        if (mode === 'single') {
            const apartmentId = apartments[0].apartmentId;
            if (scheduleType === 'HAS') {
                navigate(`/has-planning-apartment/${apartmentId}`);
            } else {
                navigate(`/planning-apartment/${apartmentId}`);
            }
        }
    };
    const handleCancel = () => {
        navigate(-1);
    };
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px',
                fontSize: '18px',
                color: '#666'
            }}>
                Loading appointment data...
            </div>
        );
    }
    if (!apartments.length) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px',
                fontSize: '18px',
                color: '#666'
            }}>
                No apartments found for scheduling.
            </div>
        );
    }
    const preselectedApartments = mode === 'single' ? [apartments[0]._id] : [];
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h1 style={{ 
                    color: '#2c3e50', 
                    marginBottom: '10px',
                    fontSize: '2rem',
                    fontWeight: '600'
                }}>
                    {pageTitle}
                </h1>
                <div style={{ 
                    color: '#7f8c8d', 
                    fontSize: '1rem',
                    fontWeight: '500'
                }}>
                    {mode === 'building' 
                        ? `Select apartments and set appointment details for ${scheduleType} scheduling`
                        : `Set appointment details for this apartment`
                    }
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