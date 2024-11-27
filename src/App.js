import './App.css';
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import HomePage from './pages/HomePage';
import DistrictPage from './pages/DistrictPage';
import BuildingPage from './pages/BuildingPage';
import CityPage from './pages/CityPage';
import AreaPage from './pages/AreaPage';
import AdminPage from './pages/AdminPage';
import AdminApartmentPage from './pages/AdminApartmentPage';
import TSPApartmentPage from './pages/TSApartmentPage';
import TSApartmentSchedulePage from './pages/TSApartmentSchedulePage';
import AgendaPage from './pages/AgendaPage.js';  // Import the new page
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import Unauthorized from './components/Unauthorized';
import RequireAuth from './components/RequireAuth';

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
    <div className='App'>
      <Routes>
        <Route element={<LoginPage />} path='/login' />
        <Route element={<Unauthorized />} path='/unauthorized' />
        <Route element={<Layout />}>
          <Route element={<RequireAuth allowedRoles={[5150]} />}>
            <Route element={<AdminPage />} path='/admin' />
            <Route element={<AdminApartmentPage />} path='/admin-apartment/:id' />
          </Route>
          <Route element={<RequireAuth allowedRoles={[1991, 5150]} />}>
            <Route element={<TSPApartmentPage />} path='/planning-apartment/:id' />
            <Route element={<TSApartmentSchedulePage />} path='/planning-apartment-schedule/:id' />
            <Route element={<AgendaPage />} path='/agenda' /> {/* Add this line */}
          </Route>
          <Route element={<RequireAuth allowedRoles={[5150, 1991, 8687, 1948, 1959, 2023]} />}>
            <Route element={<HomePage />} path='/' />
            <Route element={<CityPage />} path='/city' />
            <Route element={<AreaPage />} path='/area/:cityId' />
            <Route element={<DistrictPage />} path='/district/:areaId' />
            <Route element={<BuildingPage />} path='/building/:id' />
          </Route>
        </Route>
        <Route element={<NotFound />} path='*' />
      </Routes>
    </div>
  );
}

export default App;