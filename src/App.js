import './App.css';
import {useEffect} from 'react';
import {Routes, Route} from 'react-router-dom';
import useAuth from './hooks/useAuth';
import HomePage from './pages/HomePage';
import DistrictPage from './pages/DistrictPage';
import BuildingPage from './pages/BuildingPage';
import CityPage from './pages/CityPage';
import AreaPage from './pages/AreaPage';
import AdminPage from './pages/AdminPage';
import AdminApartmentPage from './pages/AdminApartmentPage';
import TPApartmentPage from './pages/TPApartmentPage';
import HPApartmentPage from './pages/HPApartmentPage';
import TSApartmentPage from './pages/TSApartmentPage';
import ApartmentPage from './pages/ApartmentPage.js';
import TSApartmentSchedulePage from './pages/TSApartmentSchedulePage';
import AgendaPage from './pages/AgendaPage.js';
import HASAgendaPage from './pages/HASAgendaPage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import Unauthorized from './components/Unauthorized';
import RequireAuth from './components/RequireAuth';

function App() {
    const {setAuth} = useAuth();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const roles = JSON.parse(localStorage.getItem('roles')) || [];
        if (token) {
            setAuth({accessToken: token, roles: roles});
        }
    }, [setAuth]);

    return (
        <div className='App'>
            <Routes>
                <Route element={<LoginPage/>} path='/login'/>
                <Route element={<Unauthorized/>} path='/unauthorized'/>
                <Route element={<Layout/>}>
                    {/* Admin routes */}
                    <Route element={<RequireAuth allowedRoles={[5150]}/>}>
                        <Route element={<AdminPage/>} path='/admin'/>
                        <Route element={<AdminApartmentPage/>} path='/admin-apartment/:id'/>
                    </Route>

                    {/* Technische Planning routes */}
                    <Route element={<RequireAuth allowedRoles={[1991]}/>}>
                        <Route element={<TPApartmentPage/>} path='/planning-apartment/:id'/>
                    </Route>

                    {/* HAS Planning routes */}
                    <Route element={<RequireAuth allowedRoles={[1959]}/>}>
                        <Route element={<HPApartmentPage/>} path='/has-planning-apartment/:id'/>
                    </Route>

                    {/* Technische Schouwer routes */}
                    <Route element={<RequireAuth allowedRoles={[8687]}/>}>
                        <Route element={<TSApartmentPage/>} path='/ts-apartment/:id'/>
                    </Route>

                    {/* HASMonteur and TechnischeSchouwer routes*/}
                    <Route element={<RequireAuth allowedRoles={[1959, 8687, 2023, 5150]}/>}>
                        <Route element={<HASAgendaPage/>} path='/has-agenda'/>
                    </Route>

                    {/* Shared planning routes */}
                    <Route element={<RequireAuth allowedRoles={[1991, 5150]}/>}>
                        <Route element={<TSApartmentSchedulePage/>} path='/planning-apartment-schedule/:id'/>
                        <Route element={<AgendaPage/>} path='/agenda'/>
                    </Route>

                    {/* Default routes accessible by all roles */}
                    <Route element={<RequireAuth allowedRoles={[5150, 1991, 8687, 1948, 1959, 2023]}/>}>
                        <Route element={<HomePage/>} path='/'/>
                        <Route element={<CityPage/>} path='/city'/>
                        <Route element={<AreaPage/>} path='/area/:cityId'/>
                        <Route element={<DistrictPage/>} path='/district/:areaId'/>
                        <Route element={<BuildingPage/>} path='/building/:id'/>
                        <Route element={<ApartmentPage/>} path='/apartment/:id'/> {/* Default apartment view */}
                    </Route>
                </Route>
                <Route element={<NotFound/>} path='*'/>
            </Routes>
        </div>
    );
}

export default App;