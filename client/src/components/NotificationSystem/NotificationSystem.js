import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import './NotificationSystem.css';

const NotificationSystem = ({ notifications, onMarkAsRead, onClearAll }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter notifications for current user
  const userNotifications = notifications.filter(
    notification => notification.userEmail === user?.email
  );

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'status_change':
        return '🔄';
      case 'resolved':
        return '✅';
      case 'priority_change':
        return '⚡';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (status) => {
    switch (status) {
      case 'in-progress':
        return '#3b82f6';
      case 'resolved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <>
      {user && (
        <div className="notification-system">
          <motion.button
            className="notification-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="bell-icon">🔔</span>
            {unreadCount > 0 && (
              <motion.span
                className="notification-count"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                className="notification-panel"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {userNotifications.length > 0 && (
                    <button
                      className="clear-all-btn"
                      onClick={() => onClearAll(user?.email)}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="notification-list">
                  {userNotifications.length === 0 ? (
                    <div className="no-notifications">
                      <span>📭</span>
                      <p>No notifications</p>
                    </div>
                  ) : (
                    userNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        <div className="notification-icon">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="notification-content">
                          <p className="notification-message">{notification.message}</p>
                          <p className="notification-time">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <div 
                          className="notification-status"
                          style={{ backgroundColor: getNotificationColor(notification.status) }}
                        />
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default NotificationSystem;
