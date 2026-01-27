import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../app/auth/pages/Login';
import { Dashboard } from '../app/dashboard/pages/Home';
import { PrivateRoute } from './PrivateRoute';
import { useAuth } from '../shared/contexts/AuthContext';

export function AppRoutes() {
  const { signed } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={signed ? <Navigate to="/" /> : <Login />} 
      />

      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}