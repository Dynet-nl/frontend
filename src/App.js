// Main App component with routing configuration, authentication checks, and cache invalidation provider. Handles all page routes and role-based access control.

import './App.css';
import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import { CacheInvalidationProvider } from './context/CacheInvalidationProvider';
import DashboardHomePage from './pages/DashboardHomePage';
import DistrictSelectionPage from './pages/DistrictSelectionPage';
import BuildingListPage from './pages/BuildingListPage';
import CitySelectionPage from './pages/CitySelectionPage';
import AreaSelectionPage from './pages/AreaSelectionPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminDistrictManagementPage from './pages/AdminDistrictManagementPage';
import AdminApartmentDetailPage from './pages/AdminApartmentDetailPage';
import TechnicalPlanningApartmentDetailPage from './pages/TechnicalPlanningApartmentDetailPage';
import HASPlanningApartmentDetailPage from './pages/HASPlanningApartmentDetailPage';
import TechnicalInspectorApartmentDetailPage from './pages/TechnicalInspectorApartmentDetailPage';
import HASInstallerApartmentDetailPage from './pages/HASInstallerApartmentDetailPage';
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
        <CacheInvalidationProvider>
            <div className='App'>
                <Routes>
                    <Route element={<UserLoginPage />} path='/login' />
                    <Route element={<Unauthorized />} path='/unauthorized' />
                    <Route element={<Layout />}>
                    <Route element={<RequireAuth allowedRoles={[5150]} />}>
                        <Route element={<AdminDashboardPage />} path='/admin' />
                        <Route element={<AdminDistrictManagementPage />} path='/dashboard' />
                        <Route element={<AdminApartmentDetailPage />} path='/admin-apartment/:id' />
                    </Route>

                    <Route element={<RequireAuth allowedRoles={[1991]} />}>
                        <Route element={<TechnicalPlanningApartmentDetailPage />} path='/planning-apartment/:id' />
                    </Route>

                    <Route element={<RequireAuth allowedRoles={[1959]} />}>
                        <Route element={<HASPlanningApartmentDetailPage />} path='/has-planning-apartment/:id' />
                        <Route element={<HASPlanningApartmentSchedulePage />} path='/has-planning-apartment-schedule/:id' />
                        <Route element={<UnifiedAppointmentPage />} path='/has-appointment-scheduler/:id' />
                    </Route>

                    <Route element={<RequireAuth allowedRoles={[8687]} />}>
                        <Route element={<TechnicalInspectorApartmentDetailPage />} path='/ts-apartment/:id' />
                    </Route>

                    <Route element={<RequireAuth allowedRoles={[2023, 5150, 1959]} />}>
                        <Route element={<HASInstallerApartmentDetailPage />} path='/hm-apartment/:id' />
                    </Route>

                    <Route element={<RequireAuth allowedRoles={[1959, 8687, 2023, 5150]} />}>
                        <Route element={<HASInstallerAgendaCalendarPage />} path='/has-agenda' />
                    </Route>

                    <Route element={<RequireAuth allowedRoles={[1991, 5150]} />}>
                        <Route element={<TechnicalPlanningApartmentSchedulePage />} path='/planning-apartment-schedule/:id' />
                        <Route element={<TechnicalPlanningAgendaCalendarPage />} path='/agenda' />
                        <Route element={<UnifiedAppointmentPage />} path='/appointment-scheduler/:id' />
                    </Route>

                    <Route element={<RequireAuth allowedRoles={[5150, 1991, 8687, 1948, 1959, 2023]} />}>
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
    );
}

export default App;