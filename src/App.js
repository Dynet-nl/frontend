// Main React application component with routing configuration, authentication checks, and global providers.

import './App.css';
import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import { CacheInvalidationProvider } from './context/CacheInvalidationProvider';
import { NotificationProvider } from './context/NotificationProvider';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardHomePage from './pages/DashboardHomePage';
import DistrictSelectionPage from './pages/DistrictSelectionPage';
import BuildingListPage from './pages/BuildingListPage';
import CitySelectionPage from './pages/CitySelectionPage';
import AreaSelectionPage from './pages/AreaSelectionPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminDistrictManagementPage from './pages/AdminDistrictManagementPage';
import DistrictManagementPage from './pages/DistrictManagementPage';
import OptimizedApartmentDetails from './components/OptimizedApartmentDetails';
import AppointmentSystemValidator from './components/AppointmentSystemValidator';
import TechnicalPlanningApartmentSchedulePage from './pages/TechnicalPlanningApartmentSchedulePage';
import TechnicalPlanningAgendaCalendarPage from './pages/TechnicalPlanningAgendaCalendarPage';
import HASInstallerAgendaCalendarPage from './pages/HASInstallerAgendaCalendarPage';
import UserLoginPage from './pages/UserLoginPage';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import Unauthorized from './components/Unauthorized';
import RequireAuth from './components/RequireAuth';
import HASPlanningApartmentSchedulePage from "./pages/HASPlanningApartmentSchedulePage";
import UnifiedAppointmentPage from "./pages/UnifiedAppointmentPage";
import AdminSchedulingSelectionPage from "./pages/AdminSchedulingSelectionPage";
import { ROLES } from './utils/constants';
function App() {
    const { setAuth } = useAuth();
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const roles = JSON.parse(localStorage.getItem('roles')) || [];
        if (token) {
            setAuth({ accessToken: token, roles: roles });
        }
    }, [setAuth]);
    return (
        <ErrorBoundary>
            <NotificationProvider>
                <CacheInvalidationProvider>
                    <div className='App'>
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
                                <Route element={<RequireAuth allowedRoles={[ROLES.TECHNICAL_PLANNING]} />}>
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
                    </div>
                </CacheInvalidationProvider>
            </NotificationProvider>
        </ErrorBoundary>
    );
}
export default App;
