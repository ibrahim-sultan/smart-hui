import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import './UserPasswordChange.css';

const UserPasswordChange = () => {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '', currentPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
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
      const payload = {
        newPassword: passwords.newPassword,
        currentPassword: user?.isFirstLogin ? undefined : passwords.currentPassword
      };
      await axios.put('/api/auth/change-password', payload);
      setSuccess('Password changed successfully!');
      const target =
        user?.role === 'staff' ? '/staff' :
        user?.role === 'student' ? '/student' :
        '/login';
      setTimeout(() => navigate(target, { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="user-password-change-container">
      <div className="user-password-change-card">
        <div className="user-password-change-header">
          <div className="upc-logo" style={{ backgroundImage: `url(${logo})` }} />
          <h2>Change Password</h2>
          <p>{user.isFirstLogin ? 'You must change your password before continuing' : 'Update your password'}</p>
          <div className="upc-welcome">
            Welcome, {user.firstName} {user.lastName}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="upc-form">
          {error && <div className="upc-error">{error}</div>}
          {success && <div className="upc-success">{success}</div>}

          {!user.isFirstLogin && (
            <div className="upc-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                required
              />
            </div>
          )}

          <div className="upc-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              placeholder="Enter new password (min 6 characters)"
              required
            />
          </div>

          <div className="upc-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="upc-actions">
            <button type="submit" disabled={loading} className="upc-primary">
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            <button type="button" className="upc-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserPasswordChange;
