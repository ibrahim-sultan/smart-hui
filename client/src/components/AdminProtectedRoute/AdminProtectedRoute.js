import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(admin.adminLevel)) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
