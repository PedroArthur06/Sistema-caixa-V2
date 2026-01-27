import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../shared/contexts/AuthContext';

export function PrivateRoute() {
  const { signed, loading } = useAuth();

  if (loading) {
    return <div>Carregando sistema...</div>;
  }

  return signed ? <Outlet /> : <Navigate to="/login" />;
}