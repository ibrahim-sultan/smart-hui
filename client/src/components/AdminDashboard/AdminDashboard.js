import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminDashboard.css';

const AdminDashboard = ({ complaints, onUpdatePriority, onUpdateStatus, onDeleteComplaint }) => {
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintToDelete, setComplaintToDelete] = useState(null);

  // Filter and sort complaints
  const filteredComplaints = useMemo(() => {
    let filtered = complaints.filter(complaint => {
      if (filterType !== 'all' && complaint.type !== filterType) return false;
      if (filterStatus !== 'all' && complaint.status !== filterStatus) return false;
      if (filterPriority !== 'all' && complaint.priority !== filterPriority) return false;
      return true;
    });

    // Sort complaints
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [complaints, filterType, filterStatus, filterPriority, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const highPriority = complaints.filter(c => c.priority === 'high' || c.priority === 'urgent').length;
    const studentComplaints = complaints.filter(c => c.type === 'student').length;
    const staffComplaints = complaints.filter(c => c.type === 'staff').length;

    return {
      total,
      pending,
      inProgress,
      resolved,
      highPriority,
      studentComplaints,
      staffComplaints
    };
  }, [complaints]);

  const handlePriorityChange = (complaintId, newPriority) => {
    onUpdatePriority(complaintId, newPriority);
  };

  const handleStatusChange = (complaintId, newStatus) => {
    onUpdateStatus(complaintId, newStatus);
  };

  const handleConfirmDelete = () => {
    if (complaintToDelete) {
      onDeleteComplaint(complaintToDelete);
      setComplaintToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
      case 'in-progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="admin-dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="dashboard-container">
        <motion.div className="dashboard-header" variants={itemVariants}>
          <div className="header-icon">⚙️</div>
          <h2>Admin Dashboard</h2>
          <p>Manage and monitor all complaints and issues</p>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div className="stats-grid" variants={itemVariants}>
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Complaints</p>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card progress">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <h3>{stats.inProgress}</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.resolved}</h3>
              <p>Resolved</p>
            </div>
          </div>
          <div className="stat-card high-priority">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <h3>{stats.highPriority}</h3>
              <p>High Priority</p>
            </div>
          </div>
          <div className="stat-card breakdown">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.studentComplaints}/{stats.staffComplaints}</h3>
              <p>Student/Staff</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div className="filters-section" variants={itemVariants}>
          <div className="filters-row">
            <div className="filter-group">
              <label>Type:</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status:</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Priority:</label>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="timestamp">Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="type">Type</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Order:</label>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Complaints List */}
        <motion.div className="complaints-section" variants={itemVariants}>
          <h3>Complaints ({filteredComplaints.length})</h3>
          <div className="complaints-grid">
            <AnimatePresence>
              {filteredComplaints.map((complaint) => (
                <motion.div
                  key={complaint.id}
                  className="complaint-card"
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="complaint-header">
                    <div className="complaint-type">
                      <span className={`type-badge ${complaint.type}`}>
                        {complaint.type === 'student' ? '🎓' : '👨‍🏫'} {complaint.type}
                      </span>
                    </div>
                    <div className="complaint-date">
                      {formatDate(complaint.timestamp)}
                    </div>
                  </div>
                  
                  <div className="complaint-content">
                    <h4>{complaint.name}</h4>
                    <p className="complaint-id">
                      ID: {complaint.studentId || complaint.staffId}
                      {complaint.department && ` • ${complaint.department}`}
                    </p>
                    <p className="complaint-category">{complaint.category}</p>
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
                          handlePriorityChange(complaint.id, e.target.value);
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
                          handleStatusChange(complaint.id, e.target.value);
                        }}
                        className="status-select"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      {complaint.status === 'resolved' && (
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setComplaintToDelete(complaint.id);
                          }}
                          title="Delete resolved complaint"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredComplaints.length === 0 && (
            <div className="no-complaints">
              <div className="no-complaints-icon">📭</div>
              <h3>No complaints found</h3>
              <p>No complaints match your current filters.</p>
            </div>
          )}
        </motion.div>

        {/* Complaint Detail Modal */}
        <AnimatePresence>
          {selectedComplaint && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedComplaint(null)}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
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
                    <strong>Name:</strong> {selectedComplaint.name}
                  </div>
                  <div className="detail-row">
                    <strong>ID:</strong> {selectedComplaint.studentId || selectedComplaint.staffId}
                  </div>
                  <div className="detail-row">
                    <strong>Email:</strong> {selectedComplaint.email}
                  </div>
                  {selectedComplaint.contactNumber && (
                    <div className="detail-row">
                      <strong>Contact:</strong> {selectedComplaint.contactNumber}
                    </div>
                  )}
                  {selectedComplaint.department && (
                    <div className="detail-row">
                      <strong>Department:</strong> {selectedComplaint.department}
                    </div>
                  )}
                  {selectedComplaint.matricNumber && (
                    <div className="detail-row">
                      <strong>Matric Number:</strong> {selectedComplaint.matricNumber}
                    </div>
                  )}
                  {selectedComplaint.preferredPassword && (
                    <div className="detail-row">
                      <strong>Preferred Password:</strong> {selectedComplaint.preferredPassword}
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
                    <strong>Submitted:</strong> {formatDate(selectedComplaint.timestamp)}
                  </div>
                  <div className="detail-row full-width">
                    <strong>Description:</strong>
                    <p className="description-text">{selectedComplaint.description}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {complaintToDelete && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setComplaintToDelete(null)}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Confirm Deletion</h3>
                  <button 
                    className="close-btn"
                    onClick={() => setComplaintToDelete(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this resolved complaint?</p>
                  <p>This action will archive the complaint and notify the user.</p>
                  <div className="modal-actions">
                    <button 
                      className="btn btn-cancel"
                      onClick={() => setComplaintToDelete(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-delete"
                      onClick={handleConfirmDelete}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
