import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Header from './components/Header/Header';
import Login from './components/Login/Login';
import AdminLogin from './components/AdminLogin/AdminLogin';
import Register from './components/Register/Register';
import StudentSection from './components/StudentSection/StudentSection';
import StaffSection from './components/StaffSection/StaffSection';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import AdminDashboardContainer from './components/AdminDashboard/AdminDashboardContainer';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute/AdminProtectedRoute';
import AdminHeader from './components/AdminHeader/AdminHeader';
import AdminManagement from './components/AdminManagement/AdminManagement';
import AdminPasswordChange from './components/AdminPasswordChange/AdminPasswordChange';
import NotificationSystem from './components/NotificationSystem/NotificationSystem';
import './App.css';

// Main App component with routing
function AppContent() {
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addComplaint = (complaint) => {
    const newComplaint = {
      ...complaint,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      priority: complaint.priority || 'medium',
      lastUpdated: new Date().toISOString(),
      // Ensure InternetPopup data is included
      matricNumber: complaint.matricNumber || '',
      preferredPassword: complaint.preferredPassword || ''
    };
    setComplaints(prev => [...prev, newComplaint]);
  };

  const updateComplaintPriority = (id, priority) => {
    setComplaints(prev => 
      prev.map(complaint => 
        complaint.id === id ? { ...complaint, priority, lastUpdated: new Date().toISOString() } : complaint
      )
    );
  };

  const updateComplaintStatus = (id, status) => {
    setComplaints(prev => 
      prev.map(complaint => 
        complaint.id === id ? { ...complaint, status, lastUpdated: new Date().toISOString() } : complaint
      )
    );

    // Create notification for status change
    const complaint = complaints.find(c => c.id === id);
    if (complaint) {
      const notification = {
        id: Date.now(),
        complaintId: id,
        userEmail: complaint.email,
        type: status === 'resolved' ? 'resolved' : 'status_change',
        message: status === 'resolved' 
          ? `Your complaint "${complaint.category}" has been resolved!`
          : `Your complaint "${complaint.category}" is now ${status}`,
        status: status,
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [notification, ...prev]);
    }
  };

  const deleteComplaint = (id) => {
    const complaint = complaints.find(c => c.id === id);
    if (complaint) {
      setComplaints(prev => prev.filter(complaint => complaint.id !== id));
      
      // Create notification for deletion
      const notification = {
        id: Date.now(),
        complaintId: id,
        userEmail: complaint.email,
        type: 'deleted',
        message: `Your resolved complaint "${complaint.category}" has been archived and removed from active complaints.`,
        status: 'deleted',
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [notification, ...prev]);
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  };

  const clearAllNotifications = (userEmail) => {
    setNotifications(prev =>
      prev.filter(notification => notification.userEmail !== userEmail || notification.read)
    );
  };

  const getUserComplaints = (userEmail) => {
    return complaints.filter(complaint => complaint.email === userEmail);
  };

  // Redirect based on user role after login
  const getRedirectPath = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'staff':
        return '/staff';
      case 'student':
        return '/student';
      default:
        return '/login';
    }
  };

  return (
    <div className="App">
      {user && (
        <>
          <Header />
          <NotificationSystem
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onClearAll={clearAllNotifications}
          />
        </>
      )}
      <AnimatePresence mode="wait">
        <Routes>
          {/* Login Route - First screen */}
          <Route path="/login" element={
            user ? <Navigate to={getRedirectPath()} replace /> : <Login />
          } />
          
          {/* Registration Route */}
          <Route path="/register" element={
            user ? <Navigate to={getRedirectPath()} replace /> : <Register />
          } />
          
          {/* Admin Login Route */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Admin Password Change Route - For first-time logins */}
          <Route path="/admin/change-password" element={
            <AdminProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
              <AdminPasswordChange />
            </AdminProtectedRoute>
          } />
          
          {/* Admin Dashboard Route - For regular admins and sub-admins to view complaints */}
          <Route path="/admin/dashboard" element={
            <AdminProtectedRoute allowedRoles={['admin', 'sub_admin']}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <AdminDashboardContainer />
              </motion.div>
            </AdminProtectedRoute>
          } />
          
          {/* Admin Management Route - Super Admin Only */}
          <Route path="/admin/manage" element={
            <AdminProtectedRoute allowedRoles={['super_admin']}>
              <AdminManagement />
            </AdminProtectedRoute>
          } />
          
          {/* Default route - redirect based on authentication */}
          <Route path="/" element={
            <Navigate to={user ? getRedirectPath() : '/login'} replace />
          } />
          
          {/* Protected Routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <StudentSection 
                  onSubmitComplaint={addComplaint}
                  userComplaints={getUserComplaints(user?.email)}
                />
              </motion.div>
            </ProtectedRoute>
          } />
          
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <StaffSection 
                  onSubmitComplaint={addComplaint}
                  userComplaints={getUserComplaints(user?.email)}
                />
              </motion.div>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <AdminDashboard 
                  complaints={complaints}
                  onUpdatePriority={updateComplaintPriority}
                  onUpdateStatus={updateComplaintStatus}
                  onDeleteComplaint={deleteComplaint}
                />
              </motion.div>
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

// Main App component with AuthProvider
function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminAuthProvider>
          <AppContent />
        </AdminAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
