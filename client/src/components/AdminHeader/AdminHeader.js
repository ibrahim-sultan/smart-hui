import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './AdminHeader.css';

const AdminHeader = () => {
  const { admin, adminLogout, isSuperAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        <div className="admin-header-left">
          <h1>Al-Hikmah Admin Portal</h1>
          <span className="admin-level-badge">{admin?.adminLevel === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
        </div>
        
        <button className="admin-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle navigation">
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <nav className={`admin-nav ${menuOpen ? 'open' : ''}`}>
          {isSuperAdmin() ? (
            <>
              <button 
                className="nav-button" 
                onClick={() => navigate('/admin/manage')}
              >
                👥 Manage Admins
              </button>
              <button 
                className="nav-button" 
                onClick={() => navigate('/admin/dashboard')}
              >
                📋 View Complaints
              </button>
            </>
          ) : (
            <>
              <button 
                className="nav-button" 
                onClick={() => navigate('/admin/dashboard')}
              >
                📊 Dashboard
              </button>
              <button 
                className="nav-button" 
                onClick={() => navigate('/admin/dashboard')}
              >
                📋 My Complaints
              </button>
            </>
          )}
        </nav>
        
        <div className="admin-header-right">
          <div className="admin-info">
            <span className="admin-name">{admin?.firstName} {admin?.lastName}</span>
            <span className="admin-email">{admin?.email}</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
