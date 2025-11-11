import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaTachometerAlt, FaFilter, FaList, FaExclamationCircle, FaCheckCircle, FaSpinner, FaSync, FaUserShield, FaUniversity, FaNetworkWired, FaMoneyBillWave, FaLock, FaPlusCircle, FaQuestionCircle, FaTools } from 'react-icons/fa';
import ComplaintModal from './ComplaintModal'; 
import DebugTools from './DebugTools';
import './AdminDashboard.css';

const categoryIcons = {
  academic: <FaBook />,
  infrastructure: <FaBuilding />,
  facilities: <FaHome />,
  administration: <FaCog />,
  security: <FaShieldAlt />,
  health: <FaHeartbeat />,
  transportation: <FaBus />,
  food: <FaUtensils />,
  financial: <FaMoneyBillWave />,
  other: <FaQuestionCircle />,
};

const AdminDashboard = ({ admin }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0, high_priority: 0 });
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    priority: 'all',
    category: 'all',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchComplaintsAndStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        type: filters.type,
        status: filters.status,
        priority: filters.priority,
        category: filters.category,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      // Add visibility filters based on admin permissions
      if (!admin.permissions.canSeeAllComplaints) {
        queryParams.append('visibleCategories', admin.permissions.visibleCategories.join(','));
      }

      const response = await axios.get(`/api/complaints?${queryParams}`);
      const data = response.data;
      
      setComplaints(data.complaints);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, admin.permissions.visibleCategories, admin.permissions.canSeeAllComplaints]);

  useEffect(() => {
    fetchComplaintsAndStats();
    
    // Set up auto-refresh interval (every 30 seconds)
    const interval = setInterval(fetchComplaintsAndStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchComplaintsAndStats]);

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await axios.put(`/api/complaints/${complaintId}/status`, { status: newStatus });
      fetchComplaintsAndStats(); // Refresh data after update
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update complaint status.');
    }
  };

  const handlePriorityChange = async (complaintId, newPriority) => {
    try {
      await axios.put(`/api/complaints/${complaintId}/priority`, { priority: newPriority });
      fetchComplaintsAndStats(); // Refresh data after update
    } catch (err) {
      console.error('Error updating priority:', err);
      setError('Failed to update complaint priority.');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const openModal = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const closeModal = () => {
    setSelectedComplaint(null);
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading complaints...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <FaExclamationCircle />
        <p>{error}</p>
        <button onClick={fetchComplaintsAndStats}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-icon"><FaTachometerAlt /></div>
          <div>
            <h2>Admin Dashboard</h2>
            <p>Welcome, {admin.firstName}. Here's an overview of the complaints.</p>
          </div>
        </div>

        {/* Admin Info and Access Level */}
        <div className="admin-info-container">
          <div className="admin-info">
            <div className="admin-level">
              <FaUserShield />
              <span>{admin.adminLevel}</span>
            </div>
            <div className="admin-permissions">
              <span>Visible Categories: {admin.permissions.visibleCategories.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon"><FaList /></div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Complaints</p>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon"><FaExclamationCircle /></div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card progress">
            <div className="stat-icon"><FaSync /></div>
            <div className="stat-content">
              <h3>{stats.in_progress}</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-icon"><FaCheckCircle /></div>
            <div className="stat-content">
              <h3>{stats.resolved}</h3>
              <p>Resolved</p>
            </div>
          </div>
          <div className="stat-card high-priority">
            <div className="stat-icon"><FaExclamationCircle /></div>
            <div className="stat-content">
              <h3>{stats.high_priority}</h3>
              <p>High Priority</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Type:</label>
              <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
                <option value="all">All Types</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status:</label>
              <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Priority:</label>
              <select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Category:</label>
              <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
                <option value="all">All Categories</option>
                <option value="academic">Academic</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="facilities">Facilities</option>
                <option value="administration">Administration</option>
                <option value="security">Security</option>
                <option value="health">Health</option>
                <option value="transportation">Transportation</option>
                <option value="food">Food</option>
                <option value="financial">Financial</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Sort by:</label>
              <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
                <option value="timestamp">Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="type">Type</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Order:</label>
              <select value={filters.sortOrder} onChange={(e) => handleFilterChange('sortOrder', e.target.value)}>
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Section */}
        <div className="complaints-section">
          <h3>Complaints ({complaints.length})</h3>
          <div className="complaints-grid">
            {complaints.map((complaint) => (
              <div 
                key={complaint.id} 
                className="complaint-card"
                onClick={() => openModal(complaint)}
              >
                <div className="complaint-header">
                  <div className="complaint-type">
                    <span className={`type-badge ${complaint.type}`}>
                      {complaint.type === 'student' ? '🎓' : '👨‍🏫'} {complaint.type}
                    </span>
                  </div>
                  <div className="complaint-date">
                    {new Date(complaint.timestamp).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="complaint-content">
                  <h4>{complaint.name}</h4>
                  <p className="complaint-id">
                    ID: {complaint.studentId || complaint.staffId}
                    {complaint.department && ` • ${complaint.department}`}
                  </p>
                  <p className="complaint-category">
                    {categoryIcons[complaint.category] || categoryIcons.other} {complaint.category}
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
                      onChange={(e) => handlePriorityChange(complaint.id, e.target.value)}
                      className="priority-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {complaints.length === 0 && (
            <div className="no-complaints">
              <div className="no-complaints-icon">📭</div>
              <h3>No complaints found</h3>
              <p>No complaints match your current filters.</p>
            </div>
          )}
        </div>

        {selectedComplaint && (
          <ComplaintModal 
            complaint={selectedComplaint} 
            onClose={closeModal} 
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            categoryIcons={categoryIcons}
          />
        )}

        {/* Debug Tools Section - Only for Super Admin */}
        {admin && admin.adminLevel === 'super_admin' && (
          <DebugTools />
        )}
      </div>
    </div>
  );
};

// Helper functions for colors
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
    default: return '#6b7280';
  }
};

export default AdminDashboard;
