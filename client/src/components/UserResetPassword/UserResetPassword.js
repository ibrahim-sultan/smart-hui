import React, { useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import './UserResetPassword.css';

const UserResetPassword = () => {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = paramToken || searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Reset failed');
        return;
      }
      setMessage('Password reset successful. Please log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError('Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-reset-container">
      <div className="user-reset-card">
        <h2>Reset Password</h2>
        {!token && <div className="error-message">Invalid reset token</div>}
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="reset-button" disabled={!token || loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserResetPassword;
