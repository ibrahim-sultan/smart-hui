import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-based navigation items
  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { path: '/admin', label: 'Admin Dashboard', icon: '⚙️' }
        ];
      case 'staff':
        return [
          { path: '/staff', label: 'Staff Portal', icon: '👨‍🏫' }
        ];
      case 'student':
        return [
          { path: '/student', label: 'Student Portal', icon: '🎓' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <motion.header 
      className="header"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container">
        <motion.div 
          className="logo-section"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="logo-placeholder">
            <div className="logo-circle">
              {/* Logo is displayed via CSS background image */}
            </div>
          </div>
          <div className="university-info">
            <h1 className="university-name">AL-HIKMAH UNIVERSITY</h1>
            <p className="university-location">ILORIN, NIGERIA</p>
            <p className="university-motto">Learning for Wisdom and Morality</p>
          </div>
        </motion.div>

        <button className="hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle navigation">
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <nav className={`navigation ${menuOpen ? 'open' : ''}`}>
          <ul className="nav-list">
            {navItems.map((item, index) => (
              <motion.li 
                key={item.path}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="nav-content"
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </motion.div>
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>

        {user && (
          <motion.div 
            className="user-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="user-info">
              Welcome, {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </motion.div>
        )}
      </div>

      <motion.div 
        className="header-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <h2>Institutional Complaint & Issue Reporting System</h2>
      </motion.div>
    </motion.header>
  );
};

export default Header;
