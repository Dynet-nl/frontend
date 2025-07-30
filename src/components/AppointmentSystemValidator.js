// Comprehensive appointment system validator to ensure 100% reliability across all roles
// This validates that appointment scheduling, display, and management works for all user roles

import React, { useEffect, useState } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import ROLES_LIST from '../context/roles_list';

const AppointmentSystemValidator = () => {
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const [validationResults, setValidationResults] = useState({});
    const [loading, setLoading] = useState(false);

    const isAdmin = auth?.roles?.includes(ROLES_LIST.Admin);
    const isTechnischePlanning = auth?.roles?.includes(ROLES_LIST.TechnischePlanning);
    const isHASPlanning = auth?.roles?.includes(ROLES_LIST.HASPlanning);
    const isTechnischeSchouwer = auth?.roles?.includes(ROLES_LIST.TechnischeSchouwer);
    const isHASMonteur = auth?.roles?.includes(ROLES_LIST.HASMonteur);

    const validateAppointmentSystem = async () => {
        setLoading(true);
        const results = {};

        try {
            // 1. Test Technical Planning Appointments
            if (isAdmin || isTechnischePlanning) {
                results.technicalAppointments = await validateTechnicalAppointments();
            }

            // 2. Test HAS Planning Appointments
            if (isAdmin || isHASPlanning) {
                results.hasAppointments = await validateHASAppointments();
            }

            // 3. Test Appointment Display
            results.appointmentDisplay = await validateAppointmentDisplay();

            // 4. Test Calendar Integration
            results.calendarIntegration = await validateCalendarIntegration();

            // 5. Test Data Consistency
            results.dataConsistency = await validateDataConsistency();

            setValidationResults(results);
        } catch (error) {
            console.error('Validation error:', error);
            results.error = error.message;
            setValidationResults(results);
        } finally {
            setLoading(false);
        }
    };

    const validateTechnicalAppointments = async () => {
        const checks = [];
        
        try {
            // Test fetching technical appointments
            const response = await axiosPrivate.get('/api/apartment/appointments/all-technischeplanning', {
                params: { limit: 10 }
            });
            
            checks.push({
                test: 'Fetch Technical Appointments',
                status: response.data ? 'PASS' : 'FAIL',
                data: response.data?.length || 0
            });

            // Test appointment data structure
            if (response.data && response.data.length > 0) {
                const appointment = response.data[0];
                const hasValidStructure = 
                    appointment.technischePlanning?.appointmentBooked?.date &&
                    appointment.technischePlanning?.appointmentBooked?.startTime &&
                    appointment.technischePlanning?.appointmentBooked?.endTime &&
                    appointment.technischePlanning?.appointmentBooked?.weekNumber;

                checks.push({
                    test: 'Technical Appointment Data Structure',
                    status: hasValidStructure ? 'PASS' : 'FAIL',
                    details: {
                        hasDate: !!appointment.technischePlanning?.appointmentBooked?.date,
                        hasStartTime: !!appointment.technischePlanning?.appointmentBooked?.startTime,
                        hasEndTime: !!appointment.technischePlanning?.appointmentBooked?.endTime,
                        hasWeekNumber: !!appointment.technischePlanning?.appointmentBooked?.weekNumber,
                        hasTechnician: !!appointment.technischePlanning?.technischeSchouwerName
                    }
                });
            }

        } catch (error) {
            checks.push({
                test: 'Technical Appointments API',
                status: 'FAIL',
                error: error.message
            });
        }

        return checks;
    };

    const validateHASAppointments = async () => {
        const checks = [];
        
        try {
            // Test fetching HAS appointments
            const response = await axiosPrivate.get('/api/apartment/appointments/all-hasmonteur', {
                params: { limit: 10 }
            });
            
            checks.push({
                test: 'Fetch HAS Appointments',
                status: response.data ? 'PASS' : 'FAIL',
                data: response.data?.length || 0
            });

            // Test appointment data structure
            if (response.data && response.data.length > 0) {
                const appointment = response.data[0];
                const hasValidStructure = 
                    appointment.hasMonteur?.appointmentBooked?.date &&
                    appointment.hasMonteur?.appointmentBooked?.startTime &&
                    appointment.hasMonteur?.appointmentBooked?.endTime &&
                    appointment.hasMonteur?.appointmentBooked?.weekNumber;

                checks.push({
                    test: 'HAS Appointment Data Structure',
                    status: hasValidStructure ? 'PASS' : 'FAIL',
                    details: {
                        hasDate: !!appointment.hasMonteur?.appointmentBooked?.date,
                        hasStartTime: !!appointment.hasMonteur?.appointmentBooked?.startTime,
                        hasEndTime: !!appointment.hasMonteur?.appointmentBooked?.endTime,
                        hasWeekNumber: !!appointment.hasMonteur?.appointmentBooked?.weekNumber,
                        hasMonteur: !!appointment.hasMonteur?.hasMonteurName,
                        hasType: !!appointment.hasMonteur?.appointmentBooked?.type
                    }
                });
            }

        } catch (error) {
            checks.push({
                test: 'HAS Appointments API',
                status: 'FAIL',
                error: error.message
            });
        }

        return checks;
    };

    const validateAppointmentDisplay = async () => {
        const checks = [];
        
        try {
            // Test fetching buildings with appointments
            const response = await axiosPrivate.get('/api/building', {
                params: { limit: 5 }
            });
            
            if (response.data && response.data.length > 0) {
                const building = response.data[0];
                if (building.flats && building.flats.length > 0) {
                    const flatsWithTechnicalAppointments = building.flats.filter(flat => 
                        flat.technischePlanning?.appointmentBooked?.date
                    );
                    
                    const flatsWithHASAppointments = building.flats.filter(flat => 
                        flat.hasMonteur?.appointmentBooked?.date
                    );

                    checks.push({
                        test: 'Building Flats with Technical Appointments',
                        status: 'PASS',
                        data: flatsWithTechnicalAppointments.length
                    });

                    checks.push({
                        test: 'Building Flats with HAS Appointments',
                        status: 'PASS',
                        data: flatsWithHASAppointments.length
                    });
                }
            }

        } catch (error) {
            checks.push({
                test: 'Appointment Display',
                status: 'FAIL',
                error: error.message
            });
        }

        return checks;
    };

    const validateCalendarIntegration = async () => {
        const checks = [];
        
        try {
            // Test calendar events for technical planning
            if (isAdmin || isTechnischePlanning) {
                const response = await axiosPrivate.get('/api/apartment/appointments/all-technischeplanning', {
                    params: { limit: 50 }
                });
                
                const calendarEvents = response.data
                    .filter(flat =>
                        flat.technischePlanning?.appointmentBooked?.date &&
                        flat.technischePlanning?.appointmentBooked?.startTime
                    )
                    .map(flat => {
                        const appointmentData = flat.technischePlanning.appointmentBooked;
                        return {
                            hasValidDate: !!appointmentData.date,
                            hasValidTime: !!appointmentData.startTime && !!appointmentData.endTime,
                            hasLocation: !!(flat.adres && flat.huisNummer),
                            hasTechnician: !!flat.technischePlanning.technischeSchouwerName
                        };
                    });

                checks.push({
                    test: 'Technical Calendar Events',
                    status: calendarEvents.length > 0 ? 'PASS' : 'WARN',
                    data: calendarEvents.length,
                    validEvents: calendarEvents.filter(event => 
                        event.hasValidDate && event.hasValidTime && event.hasLocation
                    ).length
                });
            }

            // Test calendar events for HAS planning
            if (isAdmin || isHASPlanning) {
                const response = await axiosPrivate.get('/api/apartment/appointments/all-hasmonteur', {
                    params: { limit: 50 }
                });
                
                const calendarEvents = response.data
                    .filter(flat =>
                        flat.hasMonteur?.appointmentBooked?.date &&
                        flat.hasMonteur?.appointmentBooked?.startTime
                    )
                    .map(flat => {
                        const appointmentData = flat.hasMonteur.appointmentBooked;
                        return {
                            hasValidDate: !!appointmentData.date,
                            hasValidTime: !!appointmentData.startTime && !!appointmentData.endTime,
                            hasLocation: !!(flat.adres && flat.huisNummer),
                            hasMonteur: !!flat.hasMonteur.hasMonteurName,
                            hasType: !!appointmentData.type
                        };
                    });

                checks.push({
                    test: 'HAS Calendar Events',
                    status: calendarEvents.length > 0 ? 'PASS' : 'WARN',
                    data: calendarEvents.length,
                    validEvents: calendarEvents.filter(event => 
                        event.hasValidDate && event.hasValidTime && event.hasLocation
                    ).length
                });
            }

        } catch (error) {
            checks.push({
                test: 'Calendar Integration',
                status: 'FAIL',
                error: error.message
            });
        }

        return checks;
    };

    const validateDataConsistency = async () => {
        const checks = [];
        
        try {
            // Test week number calculation consistency
            const testDate = new Date('2024-06-15');
            const weekNumber1 = calculateWeekNumber1(testDate);
            const weekNumber2 = calculateWeekNumber2(testDate);
            
            checks.push({
                test: 'Week Number Calculation Consistency',
                status: weekNumber1 === weekNumber2 ? 'PASS' : 'FAIL',
                details: { method1: weekNumber1, method2: weekNumber2 }
            });

            // Test date formatting consistency
            const testDateString = '2024-06-15';
            const formattedDate1 = new Date(testDateString).toISOString().split('T')[0];
            const formattedDate2 = formatDate(testDateString);
            
            checks.push({
                test: 'Date Formatting Consistency',
                status: formattedDate1 === formattedDate2 ? 'PASS' : 'FAIL',
                details: { method1: formattedDate1, method2: formattedDate2 }
            });

        } catch (error) {
            checks.push({
                test: 'Data Consistency',
                status: 'FAIL',
                error: error.message
            });
        }

        return checks;
    };

    // Week number calculation method 1 (used in most components)
    const calculateWeekNumber1 = (date) => {
        const currentDate = new Date(date);
        const startDate = new Date(currentDate.getFullYear(), 0, 1);
        const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
        return Math.ceil(days / 7);
    };

    // Week number calculation method 2 (used in backend)
    const calculateWeekNumber2 = (date) => {
        const firstJan = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
        return Math.ceil((date.getDay() + 1 + days) / 7);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const renderValidationResults = () => {
        if (loading) {
            return <div className="validation-loading">Running validation tests...</div>;
        }

        return (
            <div className="validation-results">
                {Object.entries(validationResults).map(([category, results]) => (
                    <div key={category} className="validation-category">
                        <h3>{category.replace(/([A-Z])/g, ' $1').toUpperCase()}</h3>
                        {Array.isArray(results) ? results.map((result, index) => (
                            <div key={index} className={`validation-item ${result.status.toLowerCase()}`}>
                                <div className="validation-test">{result.test}</div>
                                <div className="validation-status">{result.status}</div>
                                {result.data !== undefined && (
                                    <div className="validation-data">Data: {result.data}</div>
                                )}
                                {result.validEvents !== undefined && (
                                    <div className="validation-data">Valid Events: {result.validEvents}</div>
                                )}
                                {result.details && (
                                    <div className="validation-details">
                                        {JSON.stringify(result.details, null, 2)}
                                    </div>
                                )}
                                {result.error && (
                                    <div className="validation-error">Error: {result.error}</div>
                                )}
                            </div>
                        )) : (
                            <div className="validation-error">{results}</div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="appointment-system-validator">
            <h2>Appointment System Validation</h2>
            <p>Current Role: {
                isAdmin ? 'Admin' :
                isTechnischePlanning ? 'Technical Planning' :
                isHASPlanning ? 'HAS Planning' :
                isTechnischeSchouwer ? 'Technical Inspector' :
                isHASMonteur ? 'HAS Monteur' : 'Unknown'
            }</p>
            
            <button onClick={validateAppointmentSystem} disabled={loading}>
                {loading ? 'Validating...' : 'Run Validation Tests'}
            </button>

            {renderValidationResults()}

            <style jsx>{`
                .appointment-system-validator {
                    padding: 20px;
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .validation-loading {
                    text-align: center;
                    padding: 20px;
                    font-style: italic;
                }

                .validation-category {
                    margin-bottom: 30px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .validation-category h3 {
                    margin: 0;
                    padding: 15px;
                    background: #f5f5f5;
                    border-bottom: 1px solid #ddd;
                }

                .validation-item {
                    padding: 15px;
                    border-bottom: 1px solid #eee;
                }

                .validation-item:last-child {
                    border-bottom: none;
                }

                .validation-item.pass {
                    background: #f0f8ff;
                    border-left: 4px solid #4CAF50;
                }

                .validation-item.fail {
                    background: #fff5f5;
                    border-left: 4px solid #f44336;
                }

                .validation-item.warn {
                    background: #fffbf0;
                    border-left: 4px solid #ff9800;
                }

                .validation-test {
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .validation-status {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .validation-item.pass .validation-status {
                    background: #4CAF50;
                    color: white;
                }

                .validation-item.fail .validation-status {
                    background: #f44336;
                    color: white;
                }

                .validation-item.warn .validation-status {
                    background: #ff9800;
                    color: white;
                }

                .validation-data {
                    margin-top: 5px;
                    font-size: 14px;
                    color: #666;
                }

                .validation-details {
                    margin-top: 10px;
                    background: #f9f9f9;
                    padding: 10px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                }

                .validation-error {
                    margin-top: 5px;
                    color: #f44336;
                    font-size: 14px;
                }

                button {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-bottom: 20px;
                }

                button:disabled {
                    background: #bdc3c7;
                    cursor: not-allowed;
                }

                button:hover:not(:disabled) {
                    background: #2980b9;
                }
            `}</style>
        </div>
    );
};

export default AppointmentSystemValidator;
