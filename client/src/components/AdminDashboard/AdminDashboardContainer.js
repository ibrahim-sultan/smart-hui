import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import AdminHeader from '../AdminHeader/AdminHeader';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboardContainer = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminPermissions, setAdminPermissions] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all', 
    category: 'all',
    page: 1,
    limit: 10
  });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const { admin } = useAdminAuth();

  useEffect(() => {
    if (admin) {
      fetchComplaints();
      fetchStats();
    }
  }, [admin, filters]);

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const adminToken = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== 'all' && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/api/admin/dashboard/complaints?${params}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      setComplaints(response.data.complaints);
      setAdminPermissions(response.data.adminPermissions);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      const adminToken = localStorage.getItem('adminToken');

      let resolutionText;
      if (newStatus === 'resolved') {
        // Simple prompt for a resolution remark when marking as resolved
        resolutionText = window.prompt('Enter resolution remark (optional):', '');
      }

      const payload = resolutionText !== undefined && resolutionText !== null
        ? { status: newStatus, resolutionText }
        : { status: newStatus };

      await axios.put(`/api/complaints/${complaintId}`,
        payload,
        { headers: { Authorization: `Bearer ${adminToken}` }}
      );
      fetchComplaints();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update complaint status');
    }
  };

  const handlePriorityChange = async (complaintId, newPriority) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      await axios.put(`/api/complaints/${complaintId}`,
        { priority: newPriority },
        { headers: { Authorization: `Bearer ${adminToken}` }}
      );
      fetchComplaints();
      fetchStats();
    } catch (error) {
      console.error('Error updating priority:', error);
      setError('Failed to update complaint priority');
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'urgent': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="admin-dashboard">
        <AdminHeader />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading complaints...</p>
        </div>
      </div>
    );
  }

  const EmptyState = () => (
    <div className="empty-state">
      <p>No complaints to display yet.</p>
      <p>If you just created an admin, ensure categories are assigned or try submitting a new complaint.</p>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <AdminHeader />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Admin Dashboard</h2>
          <p>Manage and monitor complaints based on your access level</p>
          {admin && (
            <div className="admin-info">
              <span className="admin-name">{admin.firstName} {admin.lastName}</span>
              <span className="admin-level">{admin.adminLevel.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={fetchComplaints}>Retry</button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.total || 0}</h3>
              <p>Total Complaints</p>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pending || 0}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card progress">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <h3>{stats.in_progress || 0}</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.resolved || 0}</h3>
              <p>Resolved</p>
            </div>
          </div>
        </div>

        {/* Access Level Info */}
        <div className="access-info">
          <h3>Your Access Level</h3>
          <div className="access-details">
            {adminPermissions.canSeeAllComplaints ? (
              <div className="all-access-badge">Full Access - Can see all complaints</div>
            ) : (
              <div className="limited-access">
                <span>Limited Access - Categories: </span>
                {adminPermissions.visibleCategories && adminPermissions.visibleCategories.map(cat => (
                  <span key={cat} className="category-tag">{cat}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Status:</label>
              <select 
                value={filters.status} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Priority:</label>
              <select 
                value={filters.priority} 
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            {adminPermissions.visibleCategories && adminPermissions.visibleCategories.length > 1 && (
              <div className="filter-group">
                <label>Category:</label>
                <select 
                  value={filters.category} 
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {adminPermissions.visibleCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Complaints Section */}
        <div className="complaints-section">
          {complaints.length === 0 ? (
            <EmptyState />
          ) : null}
          <h3>Complaints ({complaints.length})</h3>
          {complaints.length === 0 ? (
            <div className="no-complaints">
              <div className="no-complaints-icon">📭</div>
              <h4>No complaints found</h4>
              <p>No complaints match your current access level and filters.</p>
            </div>
          ) : (
            <div className="complaints-grid">
              {complaints.map((complaint) => (
                <div
                  key={complaint._id}
                  className="complaint-card"
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="complaint-header">
                    <div className="complaint-category">
                      <span className="category-badge">{complaint.category}</span>
                    </div>
                    <div className="complaint-date">
                      {formatDate(complaint.createdAt)}
                    </div>
                  </div>
                  
                  <div className="complaint-content">
                    <h4>{complaint.submittedBy?.firstName} {complaint.submittedBy?.lastName}</h4>
                    <p className="complaint-id">
                      {complaint.submittedBy?.studentId || complaint.submittedBy?.email}
                      {complaint.submittedBy?.role && ` • ${complaint.submittedBy.role}`}
                    </p>
                    <p className="complaint-description">
                      {complaint.description.length > 100 
                        ? `${complaint.description.substring(0, 100)}...` 
                        : complaint.description}
                    </p>
                  </div>

                  <div className="complaint-footer">
                    <div className="complaint-badges">
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(complaint.priority) }}
                      >
                        {complaint.priority}
                      </span>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(complaint.status) }}
                      >
                        {complaint.status}
                      </span>
                    </div>
                    <div className="complaint-actions">
                      <select
                        value={complaint.priority}
                        onChange={(e) => {
                          e.stopPropagation();
                          handlePriorityChange(complaint._id, e.target.value);
                        }}
                        className="priority-select"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <select
                        value={complaint.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(complaint._id, e.target.value);
                        }}
                        className="status-select"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaint Detail Modal */}
        {selectedComplaint && (
          <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Complaint Details</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedComplaint(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <strong>Submitted By:</strong> {selectedComplaint.submittedBy?.firstName} {selectedComplaint.submittedBy?.lastName}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedComplaint.submittedBy?.email}
                </div>
                <div className="detail-row">
                  <strong>Role:</strong> {selectedComplaint.submittedBy?.role}
                </div>
                {selectedComplaint.submittedBy?.studentId && (
                  <div className="detail-row">
                    <strong>Student ID:</strong> {selectedComplaint.submittedBy.studentId}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Category:</strong> {selectedComplaint.category}
                </div>
                <div className="detail-row">
                  <strong>Priority:</strong> 
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(selectedComplaint.priority) }}
                  >
                    {selectedComplaint.priority}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedComplaint.status) }}
                  >
                    {selectedComplaint.status}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Submitted:</strong> {formatDate(selectedComplaint.createdAt)}
                </div>
                <div className="detail-row full-width">
                  <strong>Description:</strong>
                  <p className="description-text">{selectedComplaint.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardContainer;
