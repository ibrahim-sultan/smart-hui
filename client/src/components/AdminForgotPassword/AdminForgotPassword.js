import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';
import './AdminForgotPassword.css';

const AdminForgotPassword = () => {
  const [login, setLogin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/api/admin/forgot-password', { login });
      setMessage(response.data.message);
      setSubmitted(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setLogin(e.target.value);
  };

  if (submitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-form">
          <div className="forgot-password-header">
            <img src={logo} alt="Al-Hikmah Logo" className="forgot-password-logo" />
            <h2>Password Reset Request Sent</h2>
          </div>
          
          <div className="success-message">
            <p>{message}</p>
            <div className="instructions">
              <h4>Next Steps:</h4>
              <ol>
                <li>Contact the Super Admin to get your password reset token</li>
                <li>Once you have the token, use it to reset your password</li>
                <li>The token expires in 10 minutes for security</li>
              </ol>
            </div>
          </div>
          
          <div className="form-actions">
            <Link to="/admin/reset-password" className="reset-button">
              I Have a Reset Token
            </Link>
            <Link to="/admin/login" className="back-button">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form">
        <div className="forgot-password-header">
          <img src={logo} alt="Al-Hikmah Logo" className="forgot-password-logo" />
          <h2>Forgot Password</h2>
          <p>Enter your username or email to request a password reset</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="login">Username or Email</label>
            <input
              type="text"
              id="login"
              name="login"
              value={login}
              onChange={handleChange}
              required
              placeholder="Enter username (hui/sse/pf/XXX) or email for super admin"
            />
            <small className="input-help">
              Use your username for admin access, or email for super admin
            </small>
          </div>
          
          <button type="submit" disabled={loading} className="forgot-password-button">
            {loading ? 'Processing...' : 'Request Password Reset'}
          </button>
        </form>

        <div className="forgot-password-links">
          <p><Link to="/admin/login">← Back to Login</Link></p>
          <p><Link to="/admin/reset-password">I have a reset token →</Link></p>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
