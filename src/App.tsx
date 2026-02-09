// Main React application component with routing configuration, authentication checks, and global providers.
// Uses React.lazy for code splitting to improve initial load performance.

import './App.css';
import React, { useEffect, useState, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import { CacheInvalidationProvider } from './context/CacheInvalidationProvider';
import { NotificationProvider } from './context/NotificationProvider';
import { ThemeProvider } from './context/ThemeProvider';
import { QueryProvider } from './context/QueryProvider';
import { BreadcrumbProvider } from './context/BreadcrumbProvider';
import { ErrorProvider } from './context/ErrorProvider';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorDisplay from './components/GlobalErrorDisplay';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import Unauthorized from './components/Unauthorized';
import RequireAuth from './components/RequireAuth';
import { ROLES } from './utils/constants';
import logger from './utils/logger';

// Lazy load pages for better initial load performance
const DashboardHomePage = React.lazy(() => import('./pages/DashboardHomePage'));
const DistrictSelectionPage = React.lazy(() => import('./pages/DistrictSelectionPage'));
const BuildingListPage = React.lazy(() => import('./pages/BuildingListPage'));
const CitySelectionPage = React.lazy(() => import('./pages/CitySelectionPage'));
const AreaSelectionPage = React.lazy(() => import('./pages/AreaSelectionPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const AdminDistrictManagementPage = React.lazy(() => import('./pages/AdminDistrictManagementPage'));
const DistrictManagementPage = React.lazy(() => import('./pages/DistrictManagementPage'));
const OptimizedApartmentDetails = React.lazy(() => import('./components/OptimizedApartmentDetails'));
const AppointmentSystemValidator = React.lazy(() => import('./components/AppointmentSystemValidator'));
const TechnicalPlanningApartmentSchedulePage = React.lazy(() => import('./pages/TechnicalPlanningApartmentSchedulePage'));
const AgendaCalendarPage = React.lazy(() => import('./pages/AgendaCalendarPage'));
const UserLoginPage = React.lazy(() => import('./pages/UserLoginPage'));
const HASPlanningApartmentSchedulePage = React.lazy(() => import('./pages/HASPlanningApartmentSchedulePage'));
const UnifiedAppointmentPage = React.lazy(() => import('./pages/UnifiedAppointmentPage'));
const AdminSchedulingSelectionPage = React.lazy(() => import('./pages/AdminSchedulingSelectionPage'));

// Loading fallback component
const PageLoader: React.FC = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
    }}>
        <div style={{ textAlign: 'center' }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
            }} />
            Loading page...
        </div>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

const App: React.FC = () => {
    const { setAuth } = useAuth();
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

    useEffect(() => {
        // Note: accessToken is now stored in httpOnly cookie by the backend
        // We only check for roles in localStorage to determine if user was previously authenticated
        let roles: number[] = [];
        const storedRoles = localStorage.getItem('roles');
        if (storedRoles) {
            try {
                roles = JSON.parse(storedRoles) || [];
            } catch (error) {
                logger.warn('Failed to parse stored roles:', error);
                localStorage.removeItem('roles');
                roles = [];
            }
        }
        if (Array.isArray(roles) && roles.length > 0) {
            setAuth({ isAuthenticated: true, roles: roles });
        } else if (storedRoles) {
            localStorage.removeItem('roles');
            setAuth({});
        }
        setIsAuthLoading(false);
    }, [setAuth]);

    if (isAuthLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#666'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <QueryProvider>
                <ThemeProvider>
                    <NotificationProvider>
                        <ErrorProvider>
                            <BreadcrumbProvider>
                                <CacheInvalidationProvider>
                                    <GlobalErrorDisplay />
                                    <div className='App'>
                                <Suspense fallback={<PageLoader />}>
                                    <Routes>
                                        <Route element={<UserLoginPage />} path='/login' />
                                        <Route element={<Unauthorized />} path='/unauthorized' />
                                        <Route element={<Layout />}>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.ADMIN]} />}>
                                                <Route element={<RouteErrorBoundary pageName="Admin Dashboard"><AdminDashboardPage /></RouteErrorBoundary>} path='/admin' />
                                                <Route element={<RouteErrorBoundary pageName="District Management"><AdminDistrictManagementPage /></RouteErrorBoundary>} path='/dashboard' />
                                                <Route element={<RouteErrorBoundary pageName="District Management"><DistrictManagementPage /></RouteErrorBoundary>} path='/district-management/:areaId' />
                                                <Route element={<RouteErrorBoundary pageName="Apartment Details"><OptimizedApartmentDetails /></RouteErrorBoundary>} path='/admin-apartment/:id' />
                                                <Route element={<RouteErrorBoundary pageName="Scheduling"><AdminSchedulingSelectionPage /></RouteErrorBoundary>} path='/admin-scheduling-selection/:id' />
                                                <Route element={<RouteErrorBoundary pageName="Appointment Validator"><AppointmentSystemValidator /></RouteErrorBoundary>} path='/appointment-validator' />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.TECHNICAL_PLANNING, ROLES.WERKVOORBEREIDER]} />}>
                                                <Route element={<RouteErrorBoundary pageName="Planning Apartment"><OptimizedApartmentDetails /></RouteErrorBoundary>} path='/planning-apartment/:id' />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.HAS_PLANNING, ROLES.ADMIN]} />}>
                                                <Route element={<RouteErrorBoundary pageName="HAS Planning"><OptimizedApartmentDetails /></RouteErrorBoundary>} path='/has-planning-apartment/:id' />
                                                <Route element={<RouteErrorBoundary pageName="HAS Schedule"><HASPlanningApartmentSchedulePage /></RouteErrorBoundary>} path='/has-planning-apartment-schedule/:id' />
                                                <Route element={<RouteErrorBoundary pageName="Appointment Scheduler"><UnifiedAppointmentPage /></RouteErrorBoundary>} path='/has-appointment-scheduler/:id' />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.TECHNICAL_INSPECTOR]} />}>
                                                <Route element={<RouteErrorBoundary pageName="Technical Inspector"><OptimizedApartmentDetails /></RouteErrorBoundary>} path='/ts-apartment/:id' />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.HAS_MONTEUR, ROLES.ADMIN, ROLES.HAS_PLANNING]} />}>
                                                <Route element={<RouteErrorBoundary pageName="HAS Monteur"><OptimizedApartmentDetails /></RouteErrorBoundary>} path='/hm-apartment/:id' />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.HAS_PLANNING, ROLES.ADMIN, ROLES.TECHNICAL_INSPECTOR, ROLES.HAS_MONTEUR]} />}>
                                                <Route element={<RouteErrorBoundary pageName="HAS Agenda"><AgendaCalendarPage calendarType="HAS" /></RouteErrorBoundary>} path='/has-agenda' />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.TECHNICAL_PLANNING, ROLES.ADMIN]} />}>
                                                <Route element={<RouteErrorBoundary pageName="Planning Schedule"><TechnicalPlanningApartmentSchedulePage /></RouteErrorBoundary>} path='/planning-apartment-schedule/:id' />
                                                <Route element={<RouteErrorBoundary pageName="Agenda"><AgendaCalendarPage calendarType="TECHNICAL" /></RouteErrorBoundary>} path='/agenda' />
                                                <Route element={<RouteErrorBoundary pageName="Appointment Scheduler"><UnifiedAppointmentPage /></RouteErrorBoundary>} path='/appointment-scheduler/:id' />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.TECHNICAL_PLANNING, ROLES.TECHNICAL_INSPECTOR, ROLES.WERKVOORBEREIDER, ROLES.HAS_PLANNING, ROLES.HAS_MONTEUR]} />}>
                                                <Route element={<RouteErrorBoundary pageName="Dashboard"><DashboardHomePage /></RouteErrorBoundary>} path='/' />
                                                <Route element={<RouteErrorBoundary pageName="City Selection"><CitySelectionPage /></RouteErrorBoundary>} path='/city' />
                                                <Route element={<RouteErrorBoundary pageName="Area Selection"><AreaSelectionPage /></RouteErrorBoundary>} path='/area/:cityId' />
                                                <Route element={<RouteErrorBoundary pageName="District Selection"><DistrictSelectionPage /></RouteErrorBoundary>} path='/district/:areaId' />
                                                <Route element={<RouteErrorBoundary pageName="Building List"><BuildingListPage /></RouteErrorBoundary>} path='/building/:id' />
                                            </Route>
                                        </Route>
                                        <Route element={<NotFound />} path='*' />
                                    </Routes>
                                </Suspense>
                            </div>
                                </CacheInvalidationProvider>
                            </BreadcrumbProvider>
                        </ErrorProvider>
                    </NotificationProvider>
                </ThemeProvider>
            </QueryProvider>
        </ErrorBoundary>
    );
};

export default App;
