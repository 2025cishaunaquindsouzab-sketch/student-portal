import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app-shell loading-shell">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ?? <Outlet />;
}

export function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={['admin']}>{children ?? <Outlet />}</ProtectedRoute>;
}

export function StudentRoute({ children }) {
  return <ProtectedRoute allowedRoles={['student']}>{children ?? <Outlet />}</ProtectedRoute>;
}

export default ProtectedRoute;
