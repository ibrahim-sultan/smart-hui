import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import logo from '../../assets/logo.png';
import axios from 'axios';
import './AdminPasswordChange.css';

const AdminPasswordChange = () => {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      await axios.put('http://localhost:5000/api/admin/change-password', 
        { newPassword: passwords.newPassword },
        { headers: { Authorization: `Bearer ${adminToken}` }}
      );

      // Redirect based on admin level after successful password change
      if (admin.adminLevel === 'super_admin') {
        navigate('/admin/manage');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!admin) {
    navigate('/admin/login');
    return null;
  }

  return (
    <div className="password-change-container">
      <div className="password-change-form">
        <div className="password-change-header">
          <img src={logo} alt="Al-Hikmah Logo" className="password-change-logo" />
          <h2>Change Password</h2>
          <p>You must change your password before continuing</p>
          <div className="admin-welcome">
            Welcome, {admin.firstName} {admin.lastName}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              required
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your new password"
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" disabled={loading} className="change-password-button">
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
            <button type="button" onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPasswordChange;
