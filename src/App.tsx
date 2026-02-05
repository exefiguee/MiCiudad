import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Location from './pages/Location';
import Home from './pages/Home';
import Delivery from './pages/Delivery';
import PlaceDetail from './pages/PlaceDetail';
import AdminLayout from './admin/AdminLayout';
import AdminNegocios from './admin/AdminNegocios';
import AdminNegocioForm from './admin/AdminNegocioForm';
import NegocioPanel from './negocio/NegocioPanel';

import './App.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/location"
        element={
          <PrivateRoute>
            <Location />
          </PrivateRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/delivery"
        element={
          <PrivateRoute>
            <Delivery />
          </PrivateRoute>
        }
      />
      <Route path="/delivery/:placeId" element={<PlaceDetail />} />

      <Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminNegocios />} />
  <Route path="negocios" element={<AdminNegocios />} />
  <Route path="negocios/nuevo" element={<AdminNegocioForm />} />
  <Route path="negocios/:id" element={<NegocioPanel />} />
</Route>


    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;