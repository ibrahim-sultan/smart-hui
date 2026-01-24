import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import axios from 'axios';
import Header from './components/Header/Header';
import Login from './components/Login/Login';
import AdminLogin from './components/AdminLogin/AdminLogin';
import StudentSection from './components/StudentSection/StudentSection';
import StaffSection from './components/StaffSection/StaffSection';
import CourseManager from './components/Courses/CourseManager';
import MessageComposer from './components/Messaging/MessageComposer';
import RequestQueue from './components/Requests/RequestQueue';
import StudentInbox from './components/Messaging/StudentInbox';
import StudentRequestForm from './components/Requests/StudentRequestForm';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import AdminDashboardContainer from './components/AdminDashboard/AdminDashboardContainer';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute/AdminProtectedRoute';
import AdminManagement from './components/AdminManagement/AdminManagement';
import AdminPasswordChange from './components/AdminPasswordChange/AdminPasswordChange';
import AdminForgotPassword from './components/AdminForgotPassword/AdminForgotPassword';
import AdminResetPassword from './components/AdminResetPassword/AdminResetPassword';
import NotificationSystem from './components/NotificationSystem/NotificationSystem';
import UserPasswordChange from './components/UserPasswordChange/UserPasswordChange';
import UserResetPassword from './components/UserResetPassword/UserResetPassword';
import UserForgotPassword from './components/UserForgotPassword/UserForgotPassword';
import './App.css';

// Main App component with routing
function AppContent() {
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      try {
        const res = await axios.get('/api/notifications');
        const mapped = (res.data || []).map(n => ({
          id: n._id,
          userEmail: user.email,
          type: 'message',
          message: n.message,
          status: 'pending',
          timestamp: n.createdAt,
          read: !!n.isRead
        }));
        setNotifications(mapped);
      } catch (_) {
        setNotifications([]);
      }
    };
    loadNotifications();
  }, [user]);


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

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (_) {}
  };

  const clearAllNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      const list = res.data || [];
      await Promise.all(list.map(n => axios.delete(`/api/notifications/${n._id}`)));
    } catch (_) {}
    setNotifications([]);
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
          
          {/* Registration Route removed: accounts are managed by admins; self-registration disabled */}
          
          {/* Admin Login Route */}
          <Route path="/admin/login" element={<Login />} />
          
          {/* Admin Forgot Password Route - Public */}
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          
          {/* Admin Reset Password Route - Public */}
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />
          
          {/* Admin Password Change Route - For first-time logins */}
          <Route path="/admin/change-password" element={
            <AdminProtectedRoute allowedRoles={['super_admin', 'admin', 'sub_admin']}>
              <AdminPasswordChange />
            </AdminProtectedRoute>
          } />
          
          {/* User Password Change Route - Students/Staff first login */}
          <Route path="/change-password" element={
            <ProtectedRoute allowedRoles={['student', 'staff']}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <UserPasswordChange />
              </motion.div>
            </ProtectedRoute>
          } />
          
          {/* User Reset Password Route - via email token */}
          <Route path="/reset-password/:token" element={
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              <UserResetPassword />
            </motion.div>
          } />
          
          {/* User Forgot Password Route - Public */}
          <Route path="/forgot-password" element={
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              <UserForgotPassword />
            </motion.div>
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
                <StudentSection />
              </motion.div>
            </ProtectedRoute>
          } />
          <Route path="/student/inbox" element={
            <ProtectedRoute allowedRoles={['student']}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <StudentInbox />
              </motion.div>
            </ProtectedRoute>
          } />
          <Route path="/student/request" element={
            <ProtectedRoute allowedRoles={['student']}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <StudentRequestForm />
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
                <StaffSection />
              </motion.div>
            </ProtectedRoute>
          } />
          <Route path="/staff/courses" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <CourseManager />
              </motion.div>
            </ProtectedRoute>
          } />
          <Route path="/staff/messaging/:courseId" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <MessageComposer />
              </motion.div>
            </ProtectedRoute>
          } />
          <Route path="/staff/requests/:courseId" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
              >
                <RequestQueue />
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
