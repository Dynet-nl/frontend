// Main React application component with routing configuration and global providers.
// Uses React.lazy for code splitting to improve initial load performance.

import './App.css';
import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationProvider';
import { ThemeProvider } from './context/ThemeProvider';
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
const AgendaCalendarPage = React.lazy(() => import('./pages/AgendaCalendarPage'));
const UserLoginPage = React.lazy(() => import('./pages/UserLoginPage'));
const UnifiedAppointmentPage = React.lazy(() => import('./pages/UnifiedAppointmentPage'));
const AdminSchedulingSelectionPage = React.lazy(() => import('./pages/AdminSchedulingSelectionPage'));

const ALL_ROLES = [
    ROLES.ADMIN,
    ROLES.TECHNICAL_PLANNING,
    ROLES.TECHNICAL_INSPECTOR,
    ROLES.WERKVOORBEREIDER,
    ROLES.HAS_PLANNING,
    ROLES.HAS_MONTEUR,
];

// Loading fallback component
const PageLoader: React.FC = () => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '18px',
            color: '#666',
        }}
    >
        <div style={{ textAlign: 'center' }}>
            <div
                style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px',
                }}
            />
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

// The old per-role schedule pages were replaced by the unified scheduler; keep their URLs working.
const LegacyScheduleRedirect: React.FC<{ to: 'has-appointment-scheduler' | 'appointment-scheduler'; type: 'HAS' | 'Technical' }> = ({ to, type }) => {
    const { id } = useParams<{ id: string }>();
    return <Navigate to={`/${to}/${id}?mode=building&type=${type}`} replace />;
};

const page = (name: string, element: React.ReactNode): React.ReactElement => (
    <RouteErrorBoundary pageName={name}>{element}</RouteErrorBoundary>
);

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <NotificationProvider>
                    <ErrorProvider>
                        <BreadcrumbProvider>
                            <GlobalErrorDisplay />
                            <div className="App">
                                <Suspense fallback={<PageLoader />}>
                                    <Routes>
                                        <Route element={<UserLoginPage />} path="/login" />
                                        <Route element={<Unauthorized />} path="/unauthorized" />
                                        <Route element={<Layout />}>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.ADMIN]} />}>
                                                <Route element={page('Admin Dashboard', <AdminDashboardPage />)} path="/admin" />
                                                <Route element={page('District Management', <AdminDistrictManagementPage />)} path="/dashboard" />
                                                <Route element={page('District Management', <DistrictManagementPage />)} path="/district-management/:areaId" />
                                                <Route element={page('Apartment Details', <OptimizedApartmentDetails />)} path="/admin-apartment/:id" />
                                                <Route element={page('Scheduling', <AdminSchedulingSelectionPage />)} path="/admin-scheduling-selection/:id" />
                                                <Route element={page('Appointment Validator', <AppointmentSystemValidator />)} path="/appointment-validator" />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.TECHNICAL_PLANNING, ROLES.WERKVOORBEREIDER, ROLES.ADMIN]} />}>
                                                <Route element={page('Planning Apartment', <OptimizedApartmentDetails />)} path="/planning-apartment/:id" />
                                                <Route element={page('Appointment Scheduler', <UnifiedAppointmentPage />)} path="/appointment-scheduler/:id" />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.HAS_PLANNING, ROLES.ADMIN]} />}>
                                                <Route element={page('HAS Planning', <OptimizedApartmentDetails />)} path="/has-planning-apartment/:id" />
                                                <Route element={<LegacyScheduleRedirect to="has-appointment-scheduler" type="HAS" />} path="/has-planning-apartment-schedule/:id" />
                                                <Route element={page('Appointment Scheduler', <UnifiedAppointmentPage />)} path="/has-appointment-scheduler/:id" />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.TECHNICAL_INSPECTOR, ROLES.ADMIN]} />}>
                                                <Route element={page('Technical Inspector', <OptimizedApartmentDetails />)} path="/ts-apartment/:id" />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.HAS_MONTEUR, ROLES.ADMIN, ROLES.HAS_PLANNING, ROLES.TECHNICAL_INSPECTOR]} />}>
                                                <Route element={page('HAS Monteur', <OptimizedApartmentDetails />)} path="/hm-apartment/:id" />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.HAS_PLANNING, ROLES.ADMIN, ROLES.TECHNICAL_INSPECTOR, ROLES.HAS_MONTEUR]} />}>
                                                <Route element={page('HAS Agenda', <AgendaCalendarPage calendarType="HAS" />)} path="/has-agenda" />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={[ROLES.TECHNICAL_PLANNING, ROLES.ADMIN]} />}>
                                                <Route element={<LegacyScheduleRedirect to="appointment-scheduler" type="Technical" />} path="/planning-apartment-schedule/:id" />
                                                <Route element={page('Agenda', <AgendaCalendarPage calendarType="TECHNICAL" />)} path="/agenda" />
                                            </Route>
                                            <Route element={<RequireAuth allowedRoles={ALL_ROLES} />}>
                                                <Route element={page('Dashboard', <DashboardHomePage />)} path="/" />
                                                <Route element={page('City Selection', <CitySelectionPage />)} path="/city" />
                                                <Route element={page('Area Selection', <AreaSelectionPage />)} path="/area/:cityId" />
                                                <Route element={page('District Selection', <DistrictSelectionPage />)} path="/district/:areaId" />
                                                <Route element={page('Building List', <BuildingListPage />)} path="/building/:id" />
                                            </Route>
                                        </Route>
                                        <Route element={<NotFound />} path="*" />
                                    </Routes>
                                </Suspense>
                            </div>
                        </BreadcrumbProvider>
                    </ErrorProvider>
                </NotificationProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default App;
