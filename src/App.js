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
import ErrorBoundary from './components/ErrorBoundary';
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
const TechnicalPlanningAgendaCalendarPage = React.lazy(() => import('./pages/TechnicalPlanningAgendaCalendarPage'));
const HASInstallerAgendaCalendarPage = React.lazy(() => import('./pages/HASInstallerAgendaCalendarPage'));
const UserLoginPage = React.lazy(() => import('./pages/UserLoginPage'));
const HASPlanningApartmentSchedulePage = React.lazy(() => import('./pages/HASPlanningApartmentSchedulePage'));
const UnifiedAppointmentPage = React.lazy(() => import('./pages/UnifiedAppointmentPage'));
const AdminSchedulingSelectionPage = React.lazy(() => import('./pages/AdminSchedulingSelectionPage'));

// Loading fallback component
const PageLoader = () => (
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

function App() {
    const { setAuth } = useAuth();
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        let roles = [];
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
        if (token && Array.isArray(roles) && roles.length > 0) {
            setAuth({ accessToken: token, roles: roles });
        } else if (token || storedRoles) {
            localStorage.removeItem('accessToken');
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
                        <CacheInvalidationProvider>
                            <div className='App'>
                                <Suspense fallback={<PageLoader />}>
                                    <Routes>
                                        <Route element={<UserLoginPage />} path='/login' />
                                    <Route element={<Unauthorized />} path='/unauthorized' />
                                    <Route element={<Layout />}>
                                    <Route element={<RequireAuth allowedRoles={[ROLES.ADMIN]} />}>
                                        <Route element={<AdminDashboardPage />} path='/admin' />
                                        <Route element={<AdminDistrictManagementPage />} path='/dashboard' />
                                        <Route element={<DistrictManagementPage />} path='/district-management/:areaId' />
                                        <Route element={<OptimizedApartmentDetails />} path='/admin-apartment/:id' />
                                        <Route element={<AdminSchedulingSelectionPage />} path='/admin-scheduling-selection/:id' />
                                        <Route element={<AppointmentSystemValidator />} path='/appointment-validator' />
                                    </Route>
                                    <Route element={<RequireAuth allowedRoles={[ROLES.TECHNICAL_PLANNING, ROLES.WERKVOORBEREIDER]} />}>
                                        <Route element={<OptimizedApartmentDetails />} path='/planning-apartment/:id' />
                                    </Route>
                                    <Route element={<RequireAuth allowedRoles={[ROLES.HAS_PLANNING, ROLES.ADMIN]} />}>
                                        <Route element={<OptimizedApartmentDetails />} path='/has-planning-apartment/:id' />
                                        <Route element={<HASPlanningApartmentSchedulePage />} path='/has-planning-apartment-schedule/:id' />
                                        <Route element={<UnifiedAppointmentPage />} path='/has-appointment-scheduler/:id' />
                                    </Route>
                                    <Route element={<RequireAuth allowedRoles={[ROLES.TECHNICAL_INSPECTOR]} />}>
                                        <Route element={<OptimizedApartmentDetails />} path='/ts-apartment/:id' />
                                    </Route>
                                    <Route element={<RequireAuth allowedRoles={[ROLES.HAS_MONTEUR, ROLES.ADMIN, ROLES.HAS_PLANNING]} />}>
                                        <Route element={<OptimizedApartmentDetails />} path='/hm-apartment/:id' />
                                    </Route>
                                    <Route element={<RequireAuth allowedRoles={[ROLES.HAS_PLANNING, ROLES.ADMIN, ROLES.TECHNICAL_INSPECTOR, ROLES.HAS_MONTEUR]} />}>
                                        <Route element={<HASInstallerAgendaCalendarPage />} path='/has-agenda' />
                                    </Route>
                                    <Route element={<RequireAuth allowedRoles={[ROLES.TECHNICAL_PLANNING, ROLES.ADMIN]} />}>
                                        <Route element={<TechnicalPlanningApartmentSchedulePage />} path='/planning-apartment-schedule/:id' />
                                        <Route element={<TechnicalPlanningAgendaCalendarPage />} path='/agenda' />
                                        <Route element={<UnifiedAppointmentPage />} path='/appointment-scheduler/:id' />
                                    </Route>
                                    <Route element={<RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.TECHNICAL_PLANNING, ROLES.TECHNICAL_INSPECTOR, ROLES.WERKVOORBEREIDER, ROLES.HAS_PLANNING, ROLES.HAS_MONTEUR]} />}>
                                        <Route element={<DashboardHomePage />} path='/' />
                                        <Route element={<CitySelectionPage />} path='/city' />
                                        <Route element={<AreaSelectionPage />} path='/area/:cityId' />
                                        <Route element={<DistrictSelectionPage />} path='/district/:areaId' />
                                        <Route element={<BuildingListPage />} path='/building/:id' />
                                    </Route>
                                </Route>
                                <Route element={<NotFound />} path='*' />
                            </Routes>
                            </Suspense>
                        </div>
                    </CacheInvalidationProvider>
                </NotificationProvider>
            </ThemeProvider>
        </QueryProvider>
        </ErrorBoundary>
    );
}

export default App;
