// Routes and global providers. Pages are lazy-loaded.

import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationProvider';
import { ThemeProvider } from './context/ThemeProvider';
import { ErrorProvider } from './context/ErrorProvider';
import { ShellProvider } from './components/shell/ShellContext';
import AppShell, { lastArea } from './components/shell/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import NotFound from './components/NotFound';
import Unauthorized from './components/Unauthorized';
import RequireAuth from './components/RequireAuth';
import { TopProgress } from './components/ui/StateDisplay';
import { ROLES } from './utils/constants';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const CitiesPage = React.lazy(() => import('./pages/CitiesPage'));
const AreasPage = React.lazy(() => import('./pages/AreasPage'));
const DistrictPage = React.lazy(() => import('./pages/DistrictPage'));
const BuildingPage = React.lazy(() => import('./pages/BuildingPage'));
const ApartmentPage = React.lazy(() => import('./pages/ApartmentPage'));
const AgendaPage = React.lazy(() => import('./pages/AgendaPage'));
const SchedulerPage = React.lazy(() => import('./pages/SchedulerPage'));
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const PriorityPage = React.lazy(() => import('./pages/PriorityPage'));
const ImportPage = React.lazy(() => import('./pages/ImportPage'));
const ValidatorPage = React.lazy(() => import('./pages/ValidatorPage'));

const ALL_ROLES = [ROLES.ADMIN, ROLES.TECHNICAL_PLANNING, ROLES.TECHNICAL_INSPECTOR, ROLES.WERKVOORBEREIDER, ROLES.HAS_PLANNING, ROLES.HAS_MONTEUR];
const PLANNERS = [ROLES.ADMIN, ROLES.TECHNICAL_PLANNING, ROLES.WERKVOORBEREIDER, ROLES.TECHNICAL_INSPECTOR];
const HAS_ROLES = [ROLES.ADMIN, ROLES.HAS_PLANNING, ROLES.HAS_MONTEUR];

const page = (name: string, element: React.ReactNode): React.ReactElement => (
    <RouteErrorBoundary pageName={name}>{element}</RouteErrorBoundary>
);

/** /districts -> the last viewed area's district page, else the cities list. */
const DistrictsRedirect: React.FC = () => {
    const area = lastArea();
    return <Navigate to={area ? `/district/${area}` : '/city'} replace />;
};

/** Old per-role schedule URLs keep working. */
const LegacyScheduleRedirect: React.FC<{ type: 'HAS' | 'Technical' }> = ({ type }) => {
    const { id } = useParams<{ id: string }>();
    return <Navigate to={`/schedule/${id}?mode=building&type=${type}`} replace />;
};
const LegacySchedulerRedirect: React.FC<{ type: 'HAS' | 'Technical' }> = ({ type }) => {
    const { id } = useParams<{ id: string }>();
    const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const mode = search.get('mode') || 'building';
    return <Navigate to={`/schedule/${id}?mode=${mode}&type=${type}`} replace />;
};

const App: React.FC = () => (
    <ErrorBoundary>
        <ThemeProvider>
            <NotificationProvider>
                <ErrorProvider>
                    <ShellProvider>
                        <Suspense fallback={<TopProgress />}>
                            <Routes>
                                <Route element={<LoginPage />} path="/login" />
                                <Route element={<Unauthorized />} path="/unauthorized" />
                                <Route element={<RequireAuth allowedRoles={ALL_ROLES} />}>
                                    <Route element={<AppShell />}>
                                        <Route element={page('Home', <HomePage />)} path="/" />
                                        <Route element={page('Steden', <CitiesPage />)} path="/city" />
                                        <Route element={page('Gebieden', <AreasPage />)} path="/area/:cityId" />
                                        <Route element={<DistrictsRedirect />} path="/districts" />
                                        <Route element={page('Districten', <DistrictPage />)} path="/district/:areaId" />
                                        <Route element={page('Gebouw', <BuildingPage />)} path="/building/:id" />
                                        {/* Apartment detail: one page, role-gated sections. Old role-specific URLs stay valid. */}
                                        <Route element={page('Flat', <ApartmentPage />)} path="/apartment/:id" />
                                        <Route element={page('Flat', <ApartmentPage />)} path="/admin-apartment/:id" />
                                        <Route element={page('Flat', <ApartmentPage />)} path="/planning-apartment/:id" />
                                        <Route element={page('Flat', <ApartmentPage />)} path="/has-planning-apartment/:id" />
                                        <Route element={page('Flat', <ApartmentPage />)} path="/ts-apartment/:id" />
                                        <Route element={page('Flat', <ApartmentPage />)} path="/hm-apartment/:id" />

                                        <Route element={<RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.TECHNICAL_PLANNING]} inline />}>
                                            <Route element={page('Planningsagenda', <AgendaPage calendarType="TECHNICAL" />)} path="/agenda" />
                                        </Route>
                                        <Route element={<RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.HAS_PLANNING, ROLES.TECHNICAL_INSPECTOR, ROLES.HAS_MONTEUR]} inline />}>
                                            <Route element={page('HAS-agenda', <AgendaPage calendarType="HAS" />)} path="/has-agenda" />
                                        </Route>

                                        <Route element={<RequireAuth allowedRoles={[...PLANNERS, ...HAS_ROLES]} inline />}>
                                            <Route element={page('Inplannen', <SchedulerPage />)} path="/schedule/:id" />
                                            <Route element={<LegacySchedulerRedirect type="Technical" />} path="/appointment-scheduler/:id" />
                                            <Route element={<LegacySchedulerRedirect type="HAS" />} path="/has-appointment-scheduler/:id" />
                                            <Route element={<LegacyScheduleRedirect type="Technical" />} path="/planning-apartment-schedule/:id" />
                                            <Route element={<LegacyScheduleRedirect type="HAS" />} path="/has-planning-apartment-schedule/:id" />
                                            <Route element={<LegacySchedulerRedirect type="Technical" />} path="/admin-scheduling-selection/:id" />
                                        </Route>

                                        <Route element={<RequireAuth allowedRoles={[ROLES.ADMIN]} inline />}>
                                            <Route element={page('Gebruikers', <UsersPage />)} path="/admin" />
                                            <Route element={page('Districtprioriteit', <PriorityPage />)} path="/dashboard" />
                                            <Route element={page('Districtimport', <ImportPage />)} path="/district-management" />
                                            <Route element={page('Districtimport', <ImportPage />)} path="/district-management/:areaId" />
                                            <Route element={page('Afsprakenvalidatie', <ValidatorPage />)} path="/appointment-validator" />
                                        </Route>
                                        <Route element={<NotFound />} path="*" />
                                    </Route>
                                </Route>
                            </Routes>
                        </Suspense>
                    </ShellProvider>
                </ErrorProvider>
            </NotificationProvider>
        </ThemeProvider>
    </ErrorBoundary>
);

export default App;
