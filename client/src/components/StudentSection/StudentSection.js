import React, { useState } from 'react';
import { motion } from 'framer-motion';
import UserComplaints from '../UserComplaints/UserComplaints';
import InternetPopup from './InternetPopup';
import './StudentSection.css';

const StudentSection = ({ onSubmitComplaint, userComplaints }) => {
  const [formData, setFormData] = useState({
    surname: '',
    otherName: '',
    middleName: '',
    studentId: '',
    email: '',
    category: '',
    priority: 'medium',
    description: '',
    matricNumber: '',
    preferredPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdviserPopup, setShowAdviserPopup] = useState(false);
  const [showInternetPopup, setShowInternetPopup] = useState(false);

  const categories = [
    { value: 'Change of Course', label: 'Change of Course', icon: '📝' },
    { value: 'internet-network', label: 'Internet/Network Problems', icon: '🌐' },
    { value: 'Additional Credit', label: 'Additional Credit', icon: '📚' },
    { value: 'Password Issues', label: 'Password Issues', icon: '🔐' },
    { value: 'Payment Issues', label: 'Payment Issues', icon: '💰' },
    { value: 'hostel', label: 'Hostel/Accommodation', icon: '🏠' },
    { value: 'Transcript request', label: 'Top-Up Course Registration', icon: '📝' },
    { value: 'Additional Credit', label: 'Additional Credit', icon: '📚' },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const complaint = {
      ...formData,
      type: 'student',
      category: categories.find(cat => cat.value === formData.category)?.label || formData.category,
      // Ensure internet complaints are properly categorized
      ...(formData.category === 'internet-network' && {
        category: 'Internet/Network Problems'
      })
    };

    onSubmitComplaint(complaint);
    
    setShowSuccess(true);
    setFormData({
      name: '',
      studentId: '',
      email: '',
      category: '',
      priority: 'medium',
      description: '',
      matricNumber: '',
      preferredPassword: ''
    });
    setIsSubmitting(false);

    setTimeout(() => setShowSuccess(false), 5000);
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
        <motion.div className="section-header" variants={itemVariants}>
          <div className="header-icon">🎓</div>
          <h2>Student Complaint Portal</h2>
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

        <motion.div className="form-container" variants={itemVariants}>
          <form onSubmit={handleSubmit} className="complaint-form">
            <div className="form-row">
              <motion.div className="form-group" variants={itemVariants}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Enter your full name"
                />
              </motion.div>

              <motion.div className="form-group" variants={itemVariants}>
                <label className="form-label">Student ID *</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Enter your student ID"
                />
              </motion.div>
            </div>

            <div className="form-row">
              <motion.div className="form-group" variants={itemVariants}>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Enter your email address"
                />
              </motion.div>
            </div>

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
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
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
                <span className="stat-number">{userComplaints.filter(c => c.status === 'in-progress').length}</span>
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
          const cleanMatric = data.matricNumber.replace(/\//g, '');
          const internetComplaint = {
            name: formData.name || 'Student',
            studentId: formData.studentId || data.matricNumber,
            email: formData.email || `${cleanMatric}@alhikmah.edu.ng`,
            category: 'internet-network',
            priority: 'high',
            description: `Internet/Network access request - Matric: ${data.matricNumber}, Preferred Password: ${data.preferredPassword}`,
            matricNumber: data.matricNumber,
            preferredPassword: data.preferredPassword,
            type: 'student',
            timestamp: new Date().toISOString(),
            status: 'pending',
            lastUpdated: new Date().toISOString()
          };
          
          onSubmitComplaint(internetComplaint);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 5000);
        }}
      />
    </motion.div>
  );
};

export default StudentSection;
