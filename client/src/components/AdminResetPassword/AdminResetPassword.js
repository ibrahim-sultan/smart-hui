import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';
import './AdminResetPassword.css';

const AdminResetPassword = () => {
  const [formData, setFormData] = useState({
    token: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auto-fill token from URL if present
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setFormData(prev => ({
        ...prev,
        token: tokenFromUrl
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.token) {
      setError('Reset token is required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/admin/reset-password', {
        token: formData.token,
        newPassword: formData.newPassword
      });
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/admin/login');
      }, 3000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-form">
          <div className="reset-password-header">
            <img src={logo} alt="Al-Hikmah Logo" className="reset-password-logo" />
            <h2>Password Reset Successful</h2>
          </div>
          
          <div className="success-message">
            <p>Your password has been reset successfully!</p>
            <p>You will be redirected to the login page in a few seconds...</p>
          </div>
          
          <div className="form-actions">
            <Link to="/admin/login" className="login-button">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-form">
        <div className="reset-password-header">
          <img src={logo} alt="Al-Hikmah Logo" className="reset-password-logo" />
          <h2>Reset Password</h2>
          <p>Enter your reset token and new password</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="token">Reset Token</label>
            <input
              type="text"
              id="token"
              name="token"
              value={formData.token}
              onChange={handleChange}
              required
              placeholder="Enter the reset token provided by super admin"
            />
            <small className="input-help">
              This token was provided by the super admin and expires in 10 minutes
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
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
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your new password"
            />
          </div>
          
          <button type="submit" disabled={loading} className="reset-password-button">
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="reset-password-links">
          <p><Link to="/admin/login">← Back to Login</Link></p>
          <p><Link to="/admin/forgot-password">Need a reset token? →</Link></p>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
