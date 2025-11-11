import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create a separate axios instance for admin requests to avoid conflicts
const adminAxios = axios.create();

// Clear any existing auth headers on the admin axios instance
delete adminAxios.defaults.headers.common['Authorization'];

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored admin token on mount
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      adminAxios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      fetchAdmin();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAdmin = async () => {
    try {
      const response = await adminAxios.get('/api/admin/me');
      setAdmin(response.data);
    } catch (error) {
      console.error('Error fetching admin:', error);
      localStorage.removeItem('adminToken');
      delete adminAxios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (login, password) => {
    try {
      const response = await adminAxios.post('/api/admin/login', { login, password });
      const { token, admin } = response.data;
      
      localStorage.setItem('adminToken', token);
      adminAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAdmin(admin);
      
      return admin;
    } catch (error) {
      throw error;
    }
  };

  const adminLogout = () => {
    setAdmin(null);
    localStorage.removeItem('adminToken');
    delete adminAxios.defaults.headers.common['Authorization'];
  };

  const isSuperAdmin = () => {
    return admin?.adminLevel === 'super_admin';
  };

  const isAdmin = () => {
    return admin?.adminLevel === 'admin';
  };

  const value = {
    admin,
    adminLogin,
    adminLogout,
    isSuperAdmin,
    isAdmin,
    loading
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
