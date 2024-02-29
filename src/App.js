import './App.css'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DistrictPage from './pages/DistrictPage'
import BuildingPage from './pages/BuildingPage'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import NotFound from './components/NotFound'
import Unauthorized from './components/Unauthorized'
import RequireAuth from './components/RequireAuth'
import AdminPage from './pages/AdminPage'
import CitiesPage from './pages/CitiesPage'

function App() {
  return (
    <div className='App'>
      <Routes>
        <Route element={<LoginPage />} path='/login' />
        <Route element={<Unauthorized />} path='/unauthorized' />

        <Route element={<Layout />}>
          <Route element={ <RequireAuth allowedRoles={[5150, 1991, 8687, 1948, 1959, 2023]} /> } >
            <Route element={<HomePage />} path='/' />
          </Route>

          {}
          <Route element={<RequireAuth allowedRoles={[5150]} />}>
            <Route element={<AdminPage />} path='/admin' />
            <Route element={<CitiesPage /> } path='/city' />
            <Route element={<DistrictPage />} path='/district' />
            <Route element={<BuildingPage />} path='/building/:id' />
          </Route>
        </Route>
        <Route element={<NotFound />} path='*' />
      </Routes>
    </div>
  )
}

export default App
