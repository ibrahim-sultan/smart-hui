import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png'
import './Login.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithIdentifier } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginWithIdentifier(identifier.trim(), password);
      
      if ((user.role === 'student' || user.role === 'staff') && user.isFirstLogin) {
        navigate('/change-password');
      } else {
        switch (user.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'staff':
            navigate('/staff');
            break;
          case 'student':
            navigate('/student');
            break;
          default:
            navigate('/login');
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your ID and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setIdentifier(e.target.value);
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage('');
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Failed to send reset email');
        return;
      }
      setForgotMessage('If the email exists, a reset link has been sent.');
      setForgotEmail('');
    } catch (err) {
      setError('Failed to send reset email');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <img src={logo} alt="Al-Hikmah Logo" className="login-logo" />
          <h2>Al-Hikmah Smart HUI</h2>
          <p>Enter your matric number or staff ID and password</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="identifier">Matric Number or Staff ID</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={identifier}
              onChange={handleChange}
              required
              placeholder="e.g., HUI/CSC/21/001 or STAFF/ICT/001"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handlePasswordChange}
              required
              placeholder="Enter your password"
            />
            <small>Default first-time password: passwordhui</small>
          </div>
          
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-links">
          <p><Link to="/admin/login">Admin Login →</Link></p>
        </div>

        <div className="forgot-password">
          <h4>Forgot Password?</h4>
          {forgotMessage && <div className="success-message">{forgotMessage}</div>}
          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label htmlFor="forgotEmail">Enter your email</label>
              <input
                type="email"
                id="forgotEmail"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <button type="submit" className="login-button" disabled={!forgotEmail}>
              Send Reset Link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
