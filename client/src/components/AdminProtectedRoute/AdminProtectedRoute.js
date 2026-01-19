import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (admin.isFirstLogin && location.pathname !== '/admin/change-password') {
    return <Navigate to="/admin/change-password" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(admin.adminLevel)) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
