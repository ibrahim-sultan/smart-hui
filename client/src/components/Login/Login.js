import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import logo from '../../assets/logo.png'
import './Login.css';

const Login = () => {
  const [activeTab, setActiveTab] = useState('user');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [adminLoginInput, setAdminLoginInput] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithIdentifier } = useAuth();
  const { adminLogin } = useAdminAuth();
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

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const admin = await adminLogin(adminLoginInput.trim(), adminPassword);
      if (admin.isFirstLogin === true) {
        navigate('/admin/change-password');
        return;
      }
      if (admin.adminLevel === 'super_admin') {
        navigate('/admin/manage');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
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
  const handleAdminLoginChange = (e) => {
    setAdminLoginInput(e.target.value);
  };
  const handleAdminPasswordChange = (e) => {
    setAdminPassword(e.target.value);
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
          <div className="login-tabs" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
            <button
              type="button"
              className={`login-button ${activeTab === 'user' ? 'active' : ''}`}
              style={{ padding: '8px 12px' }}
              onClick={() => setActiveTab('user')}
            >
              Student/Staff
            </button>
            <button
              type="button"
              className={`login-button ${activeTab === 'admin' ? 'active' : ''}`}
              style={{ padding: '8px 12px' }}
              onClick={() => setActiveTab('admin')}
            >
              Admin/Super Admin
            </button>
          </div>
          <p>{activeTab === 'user' ? 'Enter your matric number or staff ID and password' : 'Enter your admin username or email and password'}</p>
        </div>
        
        {activeTab === 'user' ? (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="identifier">User ID</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={identifier}
                onChange={handleChange}
                required
                placeholder="Enter your User ID"
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
        ) : (
          <form onSubmit={handleAdminSubmit}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="adminLoginInput">Username or Email</label>
              <input
                type="text"
                id="adminLoginInput"
                name="adminLoginInput"
                value={adminLoginInput}
                onChange={handleAdminLoginChange}
                required
                placeholder="Username (hui/sse/pf/XXX) or super admin email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="adminPassword">Password</label>
              <input
                type="password"
                id="adminPassword"
                name="adminPassword"
                value={adminPassword}
                onChange={handleAdminPasswordChange}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="login-links" style={{ marginTop: '8px' }}>
              <p><Link to="/admin/forgot-password">Forgot admin password?</Link></p>
            </div>
          </form>
        )}

        <div className="login-links">
          {activeTab === 'user' ? (
            <p><Link to="/admin/login">Admin Login →</Link></p>
          ) : (
            <p><Link to="/login">Student/Staff Login →</Link></p>
          )}
        </div>

        {activeTab === 'user' && (
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
        )}
      </div>
    </div>
  );
};

export default Login;
