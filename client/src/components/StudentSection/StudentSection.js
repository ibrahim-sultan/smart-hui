import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import UserComplaints from '../UserComplaints/UserComplaints';
import InternetPopup from './InternetPopup';
import './StudentSection.css';

const StudentSection = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    category: '',
    priority: 'medium',
    description: '',
    preferredPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdviserPopup, setShowAdviserPopup] = useState(false);
  const [showInternetPopup, setShowInternetPopup] = useState(false);
  const [userComplaints, setUserComplaints] = useState([]);

  const categories = [
    { value: 'Change of Course', label: 'Change of Course', icon: '📝' },
    { value: 'internet-network', label: 'Internet/Network Problems', icon: '🌐' },
    { value: 'Additional Credit', label: 'Additional Credit', icon: '📚' },
    { value: 'Password Issues', label: 'Password Issues', icon: '🔐' },
    { value: 'Payment Issues', label: 'Payment Issues', icon: '💰' },
    { value: 'hostel', label: 'Hostel/Accommodation', icon: '🏠' },
    { value: 'Transcript request', label: 'Top-Up Course Registration', icon: '📝' },
    { value: 'Course details', label: 'Course details', icon: '📝' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category' && value === 'Course details') {
      setShowAdviserPopup(true);
    }
    
    if (name === 'category' && value === 'internet-network') {
      setShowInternetPopup(true);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const mapCategoryToServer = (valueOrLabel) => {
    const v = (valueOrLabel || '').toLowerCase();
    if (v.includes('internet') || v.includes('network')) return 'network';
    if (v.includes('additional')) return 'additional_credit';
    if (v.includes('password')) return 'password';
    if (v.includes('payment') || v.includes('finance') || v.includes('fee')) return 'financial';
    if (v.includes('hostel') || v.includes('accommodation') || v.includes('classroom') || v.includes('facility')) return 'infrastructure';
    if (v.includes('course') || v.includes('transcript') || v.includes('result')) return 'academic';
    if (v.includes('admin')) return 'administrative';
    return 'other';
  };

  const fetchUserComplaints = async () => {
    try {
      const response = await axios.get('/api/complaints');
      const data = response.data.complaints || [];
      const mapped = data.map(c => ({
        id: c._id,
        category: c.category,
        description: c.description,
        priority: c.priority,
        status: c.status,
        timestamp: c.createdAt,
        lastUpdated: c.updatedAt,
        resolutionText: c.resolution?.text,
        resolvedAt: c.resolution?.resolvedAt,
      }));
      setUserComplaints(mapped);
    } catch (err) {
      console.error('Failed to load your complaints:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserComplaints();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const serverCategory = mapCategoryToServer(formData.category);
      const payload = {
        title: `${serverCategory.toUpperCase()} issue - ${user?.studentId || 'student'}`,
        description: formData.description,
        category: serverCategory,
        priority: formData.priority,
        matricNumber: user?.studentId || null,
        preferredPassword: formData.preferredPassword || null
      };

      await axios.post('/api/complaints', payload);

      setShowSuccess(true);
      // Refresh list so student sees their new complaint and future status changes from admins
      fetchUserComplaints();

      setFormData({
        category: '',
        priority: 'medium',
        description: '',
        preferredPassword: ''
      });
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      alert(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      className="student-section"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="section-container">
        <div className="quick-actions">
          <motion.a
            href="/student/inbox"
            className="action-button inbox"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="action-icon">📬</span>
            <div className="action-text">
              <div className="action-title">Course Inbox</div>
              <div className="action-subtitle">Messages and announcements</div>
            </div>
          </motion.a>
          <motion.a
            href="/student/request"
            className="action-button contact"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="action-icon">👩‍🏫</span>
            <div className="action-text">
              <div className="action-title">Contact Lecturer</div>
              <div className="action-subtitle">Start a conversation</div>
            </div>
          </motion.a>
        </div>
        <motion.div className="section-header" variants={itemVariants}>
          <div className="header-icon">🎓</div>
          <h2>Welcome, {user?.firstName} {user?.lastName}</h2>
          <p>Submit your complaints and issues for quick resolution</p>
        </motion.div>

        {showSuccess && (
          <motion.div 
            className="success-message"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            ✅ Your complaint has been submitted successfully! We'll get back to you soon.
          </motion.div>
        )}

        {/* Student Details Card */}
        <motion.div className="details-card" variants={itemVariants}>
          <h3>Your Details</h3>
          <p>Name: {user?.firstName} {user?.lastName}</p>
          <p>Email: {user?.email}</p>
          <p>Department: {user?.department}</p>
          <p>User ID: {user?.studentId || user?.staffId || 'N/A'}</p>
        </motion.div>

        <motion.div className="form-container" variants={itemVariants}>
          <form onSubmit={handleSubmit} className="complaint-form">
            {/* Simplified form: category, priority, description */}

            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Complaint Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category, idx) => (
                  <option key={`${category.value}-${idx}`} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Priority Level</label>
              <div className="priority-options">
                {['low', 'medium', 'high'].map(priority => (
                  <label key={priority} className="priority-option">
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={handleInputChange}
                    />
                    <span className={`priority-label priority-${priority}`}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>

            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Complaint Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                required
                placeholder="Please provide detailed information about your complaint..."
                rows="6"
                maxLength={200}
              />
            </motion.div>

            <motion.div 
              className="form-actions"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="submit"
                className="btn btn-primary submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    Submit Complaint
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>

        <motion.div className="info-cards" variants={itemVariants}>
          <div className="info-card">
            <div className="info-icon">⏱️</div>
            <h3>Quick Response</h3>
            <p>We aim to respond to all complaints within 24-48 hours</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🔒</div>
            <h3>Confidential</h3>
            <p>Your information is kept secure and confidential</p>
          </div>
          <div className="info-card">
            <div className="info-icon">📞</div>
            <h3>Follow-up</h3>
            <p>We'll keep you updated on the progress of your complaint</p>
          </div>
        </motion.div>

      <UserComplaints complaints={userComplaints} />
      
      <motion.div 
        className="progress-tracker"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="progress-header">
          <h4>📊 Complaint Progress Tracker</h4>
          <p>Real-time status updates for your submitted complaints</p>
        </div>
        
            {userComplaints.length > 0 && (
              <div className="progress-summary">
                <div className="progress-stats">
                  <div className="stat-item">
                    <span className="stat-number">{userComplaints.filter(c => c.status === 'pending').length}</span>
                    <span className="stat-label">Pending</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{userComplaints.filter(c => c.status === 'in_progress' || c.status === 'in-progress').length}</span>
                    <span className="stat-label">In Progress</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{userComplaints.filter(c => c.status === 'resolved').length}</span>
                    <span className="stat-label">Resolved</span>
                  </div>
            </div>
          </div>
        )}
      </motion.div>
      </div>

      {/* Adviser Popup Modal */}
      {showAdviserPopup && (
        <motion.div 
          className="adviser-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAdviserPopup(false)}
        >
          <motion.div 
            className="adviser-popup"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adviser-popup-content">
              <div className="adviser-popup-icon">⚠️</div>
              <h3>Important Notice</h3>
              <p>Contact your Level Adviser</p>
              <button 
                className="adviser-popup-close"
                onClick={() => setShowAdviserPopup(false)}
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Internet Popup Modal */}
      <InternetPopup 
        isOpen={showInternetPopup} 
        onClose={() => setShowInternetPopup(false)}
        onSubmit={(data) => {
          // Create a proper complaint from InternetPopup data
          const payload = {
            title: `NETWORK issue - ${user?.studentId || data.matricNumber || 'student'}`,
            description: `Internet/Network access request - Matric: ${user?.studentId || data.matricNumber}, Preferred Password: ${data.preferredPassword}`,
            category: 'network',
            priority: 'high',
            matricNumber: user?.studentId || data.matricNumber,
            preferredPassword: data.preferredPassword
          };
          axios.post('/api/complaints', payload)
            .then(() => {
              setShowSuccess(true);
              fetchUserComplaints();
              setTimeout(() => setShowSuccess(false), 5000);
            })
            .catch(err => {
              console.error('Failed to submit internet complaint:', err);
              alert(err.response?.data?.message || 'Failed to submit complaint');
            });
        }}
      />
    </motion.div>
  );
};

export default StudentSection;
