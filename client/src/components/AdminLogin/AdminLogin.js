import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import logo from '../../assets/logo.png';
import './AdminLogin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin, admin } = useAdminAuth();
  const navigate = useNavigate();

  // Redirect if admin is already logged in
  useEffect(() => {
    if (admin) {
      // Check if first login first
      if (admin.isFirstLogin === true) {
        navigate('/admin/change-password');
        return;
      }
      
      // Redirect based on admin level
      if (admin.adminLevel === 'super_admin') {
        navigate('/admin/manage'); // Super admin goes to management dashboard
      } else {
        navigate('/admin/dashboard'); // Regular admins go to complaints dashboard
      }
    }
  }, [admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const admin = await adminLogin(credentials.login, credentials.password);
      
      console.log('Admin login successful:', { 
        adminLevel: admin.adminLevel, 
        isFirstLogin: admin.isFirstLogin, 
        firstName: admin.firstName 
      });
      
      // Check if this is the first login and password needs to be changed
      if (admin.isFirstLogin === true) {
        console.log('Redirecting to password change page');
        navigate('/admin/change-password');
        return;
      }
      
      // Redirect based on admin level
      if (admin.adminLevel === 'super_admin') {
        console.log('Redirecting super admin to management dashboard');
        navigate('/admin/manage'); // Super admin goes to management dashboard
      } else {
        console.log('Redirecting regular admin to complaints dashboard');
        navigate('/admin/dashboard'); // Regular admins go to complaints dashboard
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-form">
        <div className="admin-login-header">
          <img src={logo} alt="Al-Hikmah Logo" className="admin-login-logo" />
          <h2>Admin Portal</h2>
          <p>Sign in to your admin account</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="login">Username or Email</label>
            <input
              type="text"
              id="login"
              name="login"
              value={credentials.login}
              onChange={handleChange}
              required
              placeholder="Enter username (hui/sse/pf/XXX) or email for super admin"
            />
            <small className="input-help">
              Use your username for admin access, or email for super admin
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" disabled={loading} className="admin-login-button">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="admin-login-links">
          <p><Link to="/admin/forgot-password">Forgot Password?</Link></p>
          <p><Link to="/login">← Back to Student/Staff Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
