import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import '../AdminForgotPassword/AdminForgotPassword.css';

const UserForgotPassword = () => {
  const [email, setEmail] = useState('');
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
      const res = await fetch('/api/password-reset/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Failed to process request');
      } else {
        setMessage('If the email exists, a reset link has been sent to your inbox');
        setSubmitted(true);
      }
    } catch (_) {
      setError('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-form">
          <div className="forgot-password-header">
            <img src={logo} alt="Al-Hikmah Logo" className="forgot-password-logo" />
            <h2>Password Reset Email Sent</h2>
          </div>
          <div className="success-message">
            <p>{message}</p>
          </div>
          <div className="form-actions">
            <Link to="/login" className="back-button">
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
          <p>Enter your email to request a password reset link</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
          </div>
          
          <button type="submit" disabled={loading} className="forgot-password-button">
            {loading ? 'Processing...' : 'Request Password Reset'}
          </button>
        </form>

        <div className="forgot-password-links">
          <p><Link to="/login">← Back to Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default UserForgotPassword;
