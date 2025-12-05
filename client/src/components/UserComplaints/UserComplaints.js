import React from 'react';
import { motion } from 'framer-motion';
import './UserComplaints.css';

const UserComplaints = ({ complaints }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in-progress':
      case 'in_progress': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
      className="user-complaints"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="complaints-header" variants={itemVariants}>
        <h3>Your Complaints</h3>
        <p>Track the status of your submitted complaints</p>
      </motion.div>

      {complaints.length === 0 ? (
        <motion.div 
          className="no-complaints"
          variants={itemVariants}
        >
          <div className="no-complaints-icon">📭</div>
          <h4>No complaints yet</h4>
          <p>Submit your first complaint to get started!</p>
        </motion.div>
      ) : (
        <div className="complaints-list">
          {complaints.map((complaint) => (
            <motion.div
              key={complaint.id}
              className="complaint-card"
              variants={itemVariants}
              whileHover={{ y: -2 }}
            >
              <div className="complaint-header">
                <div className="complaint-category">{complaint.category}</div>
                <div className="complaint-date">{formatDate(complaint.timestamp)}</div>
              </div>

              <div className="complaint-content">
                <p className="complaint-description">{complaint.description}</p>
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
                <div className="complaint-meta">
                  <span>Submitted: {formatDate(complaint.timestamp)}</span>
                  {complaint.lastUpdated && complaint.lastUpdated !== complaint.timestamp && (
                    <span>Updated: {formatDate(complaint.lastUpdated)}</span>
                  )}
                </div>
              </div>

              {(complaint.status === 'in-progress' || complaint.status === 'in_progress') && (
                <div className="progress-indicator">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '60%' }}></div>
                  </div>
                  <span>Being processed</span>
                </div>
              )}

              {complaint.status === 'resolved' && (
                <div className="resolved-indicator">
                  <span>✅ Resolved</span>
                  {complaint.resolutionText && (
                    <p className="resolution-text">Remark: {complaint.resolutionText}</p>
                  )}
                  {complaint.resolvedAt && (
                    <p className="resolution-date">Resolved on: {formatDate(complaint.resolvedAt)}</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default UserComplaints;
