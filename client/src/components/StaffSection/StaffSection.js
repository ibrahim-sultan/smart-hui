import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import UserComplaints from '../UserComplaints/UserComplaints';
import './StaffSection.css';

const StaffSection = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    staffId: '',
    email: '',
    department: '',
    category: '',
    priority: 'medium',
    description: '',
    contactNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userComplaints, setUserComplaints] = useState([]);

  const departments = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Medicine',
    'Law',
    'Education',
    'Arts and Humanities',
    'Social Sciences',
    'Natural Sciences',
    'Islamic Studies',
    'Administration',
    'Library Services',
    'IT Services',
    'Student Affairs',
    'Finance',
    'Human Resources',
    'Other'
  ];

  const categories = [
    { value: 'result-upload', label: 'Result Upload Problems', icon: '📊' },
    { value: 'Password Issues', label: 'Password Issues', icon: '🔐' },
    { value: 'technical-problems', label: 'Technical Problems', icon: '💻' },
    { value: 'administrative', label: 'Administrative Issues', icon: '📋' },
    { value: 'equipment', label: 'Equipment/Hardware Issues', icon: '🖥️' },
    { value: 'software', label: 'Software Issues', icon: '💿' },
    { value: 'network', label: 'Network/Internet Issues', icon: '🌐' },
    { value: 'classroom', label: 'Classroom/Facility Issues', icon: '🏫' },
    { value: 'student-related', label: 'Student-Related Issues', icon: '👥' },
    { value: 'payroll', label: 'Payroll/HR Issues', icon: '💰' },
    { value: 'other', label: 'Other Issues', icon: '❓' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const mapCategoryToServer = (valueOrLabel) => {
    const v = (valueOrLabel || '').toLowerCase();
    if (v.includes('network') || v.includes('internet')) return 'network';
    if (v.includes('password')) return 'password';
    if (v.includes('admin')) return 'administrative';
    if (v.includes('payroll') || v.includes('finance') || v.includes('hr')) return 'financial';
    if (v.includes('equipment') || v.includes('hardware') || v.includes('software') || v.includes('classroom') || v.includes('facility') || v.includes('technical')) return 'infrastructure';
    if (v.includes('result') || v.includes('academic')) return 'academic';
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
        title: `${serverCategory.toUpperCase()} issue - ${formData.staffId || 'staff'}`,
        description: formData.description,
        category: serverCategory,
        priority: formData.priority
      };

      await axios.post('/api/complaints', payload);

      setShowSuccess(true);
      // Refresh list so staff see their new issue and future status changes from admins
      fetchUserComplaints();

      setFormData({
        name: '',
        staffId: '',
        email: '',
        department: '',
        category: '',
        priority: 'medium',
        description: '',
        contactNumber: ''
      });
    } catch (err) {
      console.error('Failed to submit staff complaint:', err);
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
      className="staff-section"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="section-container">
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <a href="/staff/courses"><button type="button">Manage Courses</button></a>
          <a href="/staff">Report Issue</a>
        </div>
        <motion.div className="section-header" variants={itemVariants}>
          <div className="header-icon">👨‍🏫</div>
          <h2>Staff Issue Reporting Portal</h2>
          <p>Report technical and administrative issues for prompt resolution</p>
        </motion.div>

        {showSuccess && (
          <motion.div 
            className="success-message"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            ✅ Your issue report has been submitted successfully! Our technical team will address it promptly.
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
                <label className="form-label">Staff ID *</label>
                <input
                  type="text"
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Enter your staff ID"
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

              <motion.div className="form-group" variants={itemVariants}>
                <label className="form-label">Contact Number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your phone number"
                />
              </motion.div>
            </div>

            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Department/Unit *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Select your department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Issue Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Select an issue category</option>
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
                {['low', 'medium', 'high', 'urgent'].map(priority => (
                  <label key={priority} className="priority-option">
                    <input
                      type="radio"
                      name="priority"
                      value={priority}
                      checked={formData.priority === priority}
                      onChange={handleInputChange}
                    />
                    <span className={`priority-label priority-${priority}`}>
                      {priority === 'urgent' ? '🚨 Urgent' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>

            <motion.div className="form-group" variants={itemVariants}>
              <label className="form-label">Issue Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                required
                placeholder="Please provide detailed information about the issue, including steps to reproduce if applicable..."
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
                    <span>🚀</span>
                    Submit Issue Report
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>

        <motion.div className="info-cards" variants={itemVariants}>
          <div className="info-card">
            <div className="info-icon">⚡</div>
            <h3>Priority Support</h3>
            <p>Staff issues receive priority attention with dedicated technical support</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🔧</div>
            <h3>Technical Expertise</h3>
            <p>Our IT team has specialized knowledge to resolve complex technical issues</p>
          </div>
          <div className="info-card">
            <div className="info-icon">📈</div>
            <h3>Progress Tracking</h3>
            <p>Real-time updates on issue resolution progress and status</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🎯</div>
            <h3>Quick Resolution</h3>
            <p>Most technical issues are resolved within 2-4 hours during business hours</p>
          </div>
        </motion.div>

        {/* Staff complaints overview */}
        <UserComplaints complaints={userComplaints} />
      </div>
    </motion.div>
  );
};

export default StaffSection;
