import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import AdminHeader from '../AdminHeader/AdminHeader';
import axios from 'axios';
import './AdminManagement.css';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    firstName: '',
    lastName: '',
    canSeeAllComplaints: false,
    visibleCategories: []
  });
  
  const ALL_CATEGORIES = [
    'academic', 'administrative', 'infrastructure', 'financial',
    'network', 'password', 'additional_credit', 'other'
  ];
  const [createdAdmin, setCreatedAdmin] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  // User password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetStudentId, setResetStudentId] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // User onboarding state (create student/staff)
  const [userForm, setUserForm] = useState({
    role: 'student',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    studentId: '',
    year: ''
  });
  const [userLoading, setUserLoading] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [userError, setUserError] = useState('');

  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkResults, setBulkResults] = useState([]);
  const [csvMessage, setCsvMessage] = useState('');
  const [csvError, setCsvError] = useState('');
  const [dragActive, setDragActive] = useState(false);

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
      
      const response = await axios.get('/api/admin/list', {
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
      const payload = {
        username: newAdmin.username,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        canSeeAllComplaints: newAdmin.canSeeAllComplaints,
        visibleCategories: newAdmin.canSeeAllComplaints ? ALL_CATEGORIES : newAdmin.visibleCategories
      };

      const response = await axios.post('/api/admin/create', payload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      setCreatedAdmin(response.data);
      setNewAdmin({ username: '', firstName: '', lastName: '', canSeeAllComplaints: false, visibleCategories: [] });
      setShowCreateModal(false);
      setShowSuccessModal(true);
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
      await axios.put(`/api/admin/${adminId}`,
        { isActive: !isActive },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    setDeleteLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      await axios.delete(`/api/admin/${adminId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setShowDeleteModal(false);
      setAdminToDelete(null);
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      setError('Failed to delete admin');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetUserPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    setResetError('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      const payload = {};
      if (resetEmail) payload.email = resetEmail;
      if (resetStudentId) payload.studentId = resetStudentId;

      if (!payload.email && !payload.studentId) {
        setResetError('Please enter an email or student ID.');
        setResetLoading(false);
        return;
      }

      const response = await axios.post('/api/admin/users/reset-password', payload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      setResetMessage(
        `Password reset for ${response.data.user.email}. Default password: ${response.data.defaultPassword}`
      );
      setResetEmail('');
      setResetStudentId('');
    } catch (error) {
      console.error('Error resetting user password:', error);
      setResetError(error.response?.data?.message || 'Failed to reset user password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserLoading(true);
    setUserMessage('');
    setUserError('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      const payload = {
        role: userForm.role,
        firstName: userForm.firstName.trim(),
        lastName: userForm.lastName.trim(),
        email: userForm.email.trim(),
        department: userForm.department.trim(),
        studentId: userForm.role === 'student' ? (userForm.studentId.trim() || undefined) : undefined,
        year: userForm.role === 'student' ? (userForm.year || null) : null
      };

      const response = await axios.post('/api/admin/users/create', payload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      setUserMessage(
        `User created: ${response.data.user.email} (${response.data.user.role}). Default password: ${response.data.defaultPassword}`
      );
      setUserForm({
        role: 'student',
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        studentId: '',
        year: ''
      });
    } catch (error) {
      setUserError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setUserLoading(false);
    }
  };

  const handleBulkCreateUsers = async (e) => {
    e.preventDefault();
    setBulkLoading(true);
    setBulkMessage('');
    setBulkError('');
    setBulkResults([]);
    try {
      let users;
      try {
        users = JSON.parse(bulkText);
      } catch {
        setBulkError('Input must be valid JSON array');
        setBulkLoading(false);
        return;
      }
      if (!Array.isArray(users) || users.length === 0) {
        setBulkError('Provide a non-empty JSON array of users');
        setBulkLoading(false);
        return;
      }
      const adminToken = localStorage.getItem('adminToken');
      const response = await axios.post('/api/admin/users/bulk', { users }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setBulkResults(response.data.results || []);
      setBulkMessage(`Processed ${users.length} users. Default password: ${response.data.defaultPassword}`);
      setBulkText('');
    } catch (error) {
      setBulkError(error.response?.data?.message || 'Failed to process bulk users');
    } finally {
      setBulkLoading(false);
    }
  };

  const parseCSV = (text) => {
    const rows = [];
    let i = 0;
    let current = '';
    let row = [];
    let inQuotes = false;
    const pushCell = () => {
      row.push(current);
      current = '';
    };
    const pushRow = () => {
      // ignore empty trailing rows
      if (row.length > 0 && row.some(c => c.trim() !== '')) {
        rows.push(row);
      }
      row = [];
    };
    while (i < text.length) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            current += '"';
            i += 2;
            continue;
          } else {
            inQuotes = false;
            i++;
            continue;
          }
        } else {
          current += ch;
          i++;
          continue;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
          continue;
        }
        if (ch === ',') {
          pushCell();
          i++;
          continue;
        }
        if (ch === '\n') {
          pushCell();
          pushRow();
          i++;
          continue;
        }
        if (ch === '\r') {
          // handle CRLF
          pushCell();
          pushRow();
          if (text[i + 1] === '\n') i++;
          i++;
          continue;
        }
        current += ch;
        i++;
      }
    }
    // flush last cell/row
    pushCell();
    pushRow();
    // map to objects using header row
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] || '').trim();
      });
      return obj;
    });
  };

  const handleCSVUpload = async (file) => {
    setCsvMessage('');
    setCsvError('');
    setBulkResults([]);
    if (!file) {
      setCsvError('No file selected');
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = String(e.target.result || '');
          const items = parseCSV(text);
          if (!Array.isArray(items) || items.length === 0) {
            setCsvError('CSV has no data rows');
            return;
          }
          // normalize to API expected shape
          const users = items.map(u => ({
            role: (u.role || '').toLowerCase() === 'staff' ? 'staff' : 'student',
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            email: u.email || '',
            department: u.department || '',
            studentId: u.studentId ? u.studentId : undefined,
            year: u.year ? u.year : null
          }));
          setBulkLoading(true);
          const adminToken = localStorage.getItem('adminToken');
          const response = await axios.post('/api/admin/users/bulk', { users }, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          setBulkResults(response.data.results || []);
          setCsvMessage(`Processed ${users.length} users from CSV. Default password: ${response.data.defaultPassword}`);
        } catch (err) {
          setCsvError(err.response?.data?.message || 'Failed to process CSV');
        } finally {
          setBulkLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setCsvError('Unable to read CSV file');
    }
  };

  const handleTemplateDownload = () => {
    const headers = ['role','firstName','lastName','email','department','studentId','year'].join(',');
    const row1 = ['student','Ada','Lovelace','ada@example.com','Computer Science','HUI/CSC/21/001','1st'].join(',');
    const row2 = ['staff','Grace','Hopper','grace@example.com','ICT','',''].join(',');
    const csv = `${headers}\n${row1}\n${row2}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleCSVUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
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
                  {admin.adminLevel !== 'super_admin' && (
                    <button 
                      className="delete-btn"
                      onClick={() => {
                        setAdminToDelete(admin);
                        setShowDeleteModal(true);
                      }}
                      title="Delete admin"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student/Staff Password Reset Section */}
      <div className="user-password-reset">
        <h3>Reset Student/Staff Password</h3>
        <p className="section-help">
          Use this tool when a student or staff forgets their password. Their password will be reset to the default
          value <code>passwordhui</code>, and they should log in and change it to their desired password.
        </p>
        <form onSubmit={handleResetUserPassword} className="reset-form">
          {resetError && <div className="error-message">{resetError}</div>}
          {resetMessage && <div className="success-message">{resetMessage}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Email (optional)</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="student/staff email"
              />
            </div>
            <div className="form-group">
              <label>Student ID (optional)</label>
              <input
                type="text"
                value={resetStudentId}
                onChange={(e) => setResetStudentId(e.target.value)}
                placeholder="student ID (if available)"
              />
            </div>
          </div>
          <p className="form-note">Enter at least one of email or student ID.</p>
          <button type="submit" disabled={resetLoading} className="reset-btn reset-default-btn">
            {resetLoading ? 'Resetting...' : 'Reset Password to Default'}
          </button>
        </form>
      </div>

      {/* User Onboarding Section */}
      <div className="user-password-reset">
        <h3>Onboard New Student/Staff</h3>
        <p className="section-help">
          Create a new student or staff account. The default password will be provided; the user should log in and change it on first use.
        </p>
        <form onSubmit={handleCreateUser} className="reset-form">
          {userError && <div className="error-message">{userError}</div>}
          {userMessage && <div className="success-message">{userMessage}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                value={userForm.department}
                onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                placeholder="e.g., Computer Science"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={userForm.firstName}
                onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={userForm.lastName}
                onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
                placeholder="name@example.com"
              />
            </div>
            {userForm.role === 'student' && (
              <div className="form-group">
                <label>Student ID (optional)</label>
                <input
                  type="text"
                  value={userForm.studentId}
                  onChange={(e) => setUserForm({ ...userForm, studentId: e.target.value })}
                  placeholder="e.g., HUI/CSC/21/001"
                />
              </div>
            )}
          </div>
          {userForm.role === 'student' && (
            <div className="form-row">
              <div className="form-group">
                <label>Year (optional)</label>
                <select
                  value={userForm.year}
                  onChange={(e) => setUserForm({ ...userForm, year: e.target.value })}
                >
                  <option value="">Not set</option>
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="3rd">3rd</option>
                  <option value="4th">4th</option>
                  <option value="5th">5th</option>
                </select>
              </div>
            </div>
          )}
          <button type="submit" disabled={userLoading} className="reset-btn create-user-btn">
            {userLoading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      {/* Bulk Onboarding Section */}
      <div className="user-password-reset">
        <h3>Bulk Onboard Students/Staff</h3>
        <p className="section-help">
          Paste a JSON array of users with keys: role (student|staff), firstName, lastName, email, department, optional studentId and year for students.
        </p>
        <div className="form-group">
          <button type="button" className="reset-btn" onClick={handleTemplateDownload}>
            Download CSV Template
          </button>
        </div>
        <div className="form-group">
          <label>Upload CSV (role,firstName,lastName,email,department,studentId,year)</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => handleCSVUpload(e.target.files?.[0])}
          />
          {csvError && <div className="error-message">{csvError}</div>}
          {csvMessage && <div className="success-message">{csvMessage}</div>}
        </div>
        <div
          className={`modal-content`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: '2px dashed #667eea',
            padding: '1rem',
            background: dragActive ? '#edf2f7' : 'transparent'
          }}
        >
          <p>Drag and drop CSV here</p>
        </div>
        <form onSubmit={handleBulkCreateUsers} className="reset-form">
          {bulkError && <div className="error-message">{bulkError}</div>}
          {bulkMessage && <div className="success-message">{bulkMessage}</div>}
          <div className="form-group">
            <label>Users JSON</label>
            <textarea
              className="cm-textarea"
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder='[{"role":"student","firstName":"A","lastName":"B","email":"a@example.com","department":"Computer Science","studentId":"HUI/CSC/21/001","year":"1st"},{"role":"staff","firstName":"C","lastName":"D","email":"c@example.com","department":"ICT"}]'
              required
            />
          </div>
          <button type="submit" disabled={bulkLoading} className="reset-btn bulk-users-btn">
            {bulkLoading ? 'Processing...' : 'Process Bulk Users'}
          </button>
        </form>
        {bulkResults.length > 0 && (
          <div className="admins-list">
            <h3>Bulk Results</h3>
            <div className="admins-grid">
              {bulkResults.map((r, idx) => (
                <div key={idx} className="admin-card">
                  <div className="admin-info">
                    <h4>{r.email || 'N/A'}</h4>
                    <p>Status: {r.status}</p>
                    {r.reason && <p>Reason: {r.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
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

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newAdmin.canSeeAllComplaints}
                      onChange={(e) => setNewAdmin({
                        ...newAdmin,
                        canSeeAllComplaints: e.target.checked,
                        visibleCategories: e.target.checked ? ALL_CATEGORIES : newAdmin.visibleCategories
                      })}
                    />
                    {' '}Grant access to ALL categories
                  </label>
                </div>

                {!newAdmin.canSeeAllComplaints && (
                  <div className="form-group">
                    <label>Visible Categories</label>
                    <div className="categories-checklist">
                      {ALL_CATEGORIES.map(cat => (
                        <label key={cat} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={newAdmin.visibleCategories.includes(cat)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setNewAdmin(prev => ({
                                ...prev,
                                visibleCategories: checked
                                  ? [...prev.visibleCategories, cat]
                                  : prev.visibleCategories.filter(c => c !== cat)
                              }));
                            }}
                          />
                          <span>{cat}</span>
                        </label>
                      ))}
                    </div>
                    <small className="form-note">Select one or more categories for this admin.</small>
                  </div>
                )}

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

        {showSuccessModal && createdAdmin && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Admin Created Successfully</h3>
              <div className="success-message">
                <div className="success-icon">✅</div>
                <p><strong>Username:</strong> {createdAdmin.admin.username}</p>
                <p><strong>Name:</strong> {createdAdmin.admin.firstName} {createdAdmin.admin.lastName}</p>
                
                <div className="credentials-box">
                  <h4>🔑 Login Credentials</h4>
                  <div className="credential-row">
                    <strong>Username:</strong> 
                    <code className="credential-value">{createdAdmin.admin.username}</code>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText(createdAdmin.admin.username)}
                      title="Copy username"
                    >
                      📋
                    </button>
                  </div>
                  <div className="credential-row">
                    <strong>Temporary Password:</strong> 
                    <code className="credential-value">{createdAdmin.temporaryPassword}</code>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText(createdAdmin.temporaryPassword)}
                      title="Copy password"
                    >
                      📋
                    </button>
                  </div>
                  <div className="login-url">
                    <strong>Login URL:</strong> 
                    <a href="/admin/login" target="_blank" rel="noopener noreferrer">
                      /admin/login
                    </a>
                  </div>
                </div>
                
                <div className="info-message">
                  <p><strong>Important Instructions:</strong></p>
                  <ul>
                    <li>✅ Share these credentials securely with the new admin</li>
                    <li>⚠️ The admin MUST change their password on first login</li>
                    <li>🔒 The temporary password will be invalid after first use</li>
                    <li>📝 Save these credentials before closing this dialog</li>
                  </ul>
                </div>
              </div>
              <button onClick={() => setShowSuccessModal(false)}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}

        {showDeleteModal && adminToDelete && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete Admin</h3>
              <div className="delete-confirmation">
                <div className="warning-icon">⚠️</div>
                <p>Are you sure you want to delete the following admin?</p>
                <div className="admin-details">
                  <p><strong>Name:</strong> {adminToDelete.firstName} {adminToDelete.lastName}</p>
                  <p><strong>Username:</strong> {adminToDelete.username}</p>
                  <p><strong>Email:</strong> {adminToDelete.email}</p>
                </div>
                <p className="warning">This action cannot be undone.</p>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="delete-button"
                  onClick={() => handleDeleteAdmin(adminToDelete._id)}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Admin'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminManagement;
