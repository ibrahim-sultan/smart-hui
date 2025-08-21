import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import AdminHeader from '../AdminHeader/AdminHeader';
import axios from 'axios';
import './AdminManagement.css';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    firstName: '',
    lastName: ''
  });
  const [createdAdmin, setCreatedAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const { isSuperAdmin, admin } = useAdminAuth();

  useEffect(() => {
    // Only fetch admins when admin auth is loaded and user is super admin
    if (admin && isSuperAdmin()) {
      fetchAdmins();
    } else if (admin && !isSuperAdmin()) {
      setFetchLoading(false);
    }
  }, [admin, isSuperAdmin]);

  const fetchAdmins = async () => {
    setFetchLoading(true);
    setError(''); // Clear previous errors
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('No admin token found');
      }
      
      const response = await axios.get('http://localhost:5000/api/admin/list', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      // Only set error if it's not a 401/403 (which would be handled by redirect)
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        setError('Failed to fetch admins');
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await axios.post('http://localhost:5000/api/admin/create', newAdmin, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      setCreatedAdmin(response.data);
      setNewAdmin({ username: '', firstName: '', lastName: '' });
      setShowCreateModal(false);
      setShowPasswordModal(true);
      fetchAdmins();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (adminId, isActive) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      await axios.put(`http://localhost:5000/api/admin/${adminId}`, 
        { isActive: !isActive },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
    }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="access-denied">
        <AdminHeader />
        <div className="access-denied-content">
          <h2>Access Denied</h2>
          <p>Only super admins can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-management">
      <AdminHeader />
      <div className="management-header">
        <h2>Super Admin Dashboard</h2>
        <p className="dashboard-subtitle">Manage administrators and oversee system operations</p>
        <button 
          className="create-btn"
          onClick={() => {
            setError(''); // Clear any previous errors
            setShowCreateModal(true);
          }}
          disabled={fetchLoading}
        >
          {fetchLoading ? 'Loading...' : 'Create New Admin'}
        </button>
      </div>

      <div className="admins-list">
        <h3>Current Admins ({admins.length})</h3>
        {fetchLoading ? (
          <div className="loading-state">
            <p>Loading admins...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Error loading admins: {error}</p>
            <button onClick={fetchAdmins} className="retry-btn">Retry</button>
          </div>
        ) : (
          <div className="admins-grid">
            {admins.map(admin => (
              <div key={admin._id} className="admin-card">
                <div className="admin-info">
                  <h4>{admin.firstName} {admin.lastName}</h4>
                  <p>@{admin.username}</p>
                  <p>{admin.email}</p>
                  <span className={`level-badge ${admin.adminLevel}`}>
                    {admin.adminLevel.replace('_', ' ')}
                  </span>
                </div>
                <div className="admin-categories">
                  <strong>Access:</strong>
                  <div className="categories-list">
                    {admin.permissions?.visibleCategories?.map(cat => (
                      <span key={cat} className="category-tag">{cat}</span>
                    )) || (
                      <span className="category-tag">No specific categories</span>
                    )}
                  </div>
                  {admin.permissions?.canSeeAllComplaints && (
                    <div className="all-access-badge">All Categories Access</div>
                  )}
                </div>
                <div className="admin-actions">
                  <button 
                    className={`toggle-btn ${admin.isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleActive(admin._id, admin.isActive)}
                  >
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Create New Admin</h3>
              <form onSubmit={handleCreateAdmin}>
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={newAdmin.firstName}
                    onChange={(e) => setNewAdmin({...newAdmin, firstName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={newAdmin.lastName}
                    onChange={(e) => setNewAdmin({...newAdmin, lastName: e.target.value})}
                    required
                  />
                </div>
                
                <small className="form-note">Username format: hui/sse/pf/XXX (where XXX is a 3-digit number)</small>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showPasswordModal && createdAdmin && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Admin Created Successfully</h3>
              <div className="password-display">
                <p><strong>Username:</strong> {createdAdmin.admin.username}</p>
                <p><strong>Temporary Password:</strong> {createdAdmin.temporaryPassword}</p>
                <p className="warning">Please share this password securely with the new admin.</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminManagement;
