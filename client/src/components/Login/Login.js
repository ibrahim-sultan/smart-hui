import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import logo from '../../assets/logo.png';
import './Login.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
        return;
      } catch (_) {}

      const admin = await adminLogin(identifier.trim(), password);
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

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <img src={logo} alt="Al-Hikmah Logo" className="login-logo" />
          <h2>Al-Hikmah Smart HUI</h2>
        </div>
        
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
        
        <div className="login-links" style={{ marginTop: '8px' }}>
          <p><Link to="/forgot-password">Forgot password?</Link></p>
        </div>
      </div>
    </div>
  );
};
export default Login;
