import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ accountType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="app-loading" role="status">Checking your sign-in…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (accountType && user.accountType !== accountType) {
    return <Navigate to={`/dashboard/${user.accountType}`} replace />;
  }

  return <Outlet />;
}
