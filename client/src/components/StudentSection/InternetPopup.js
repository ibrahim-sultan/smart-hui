import React, { useState } from 'react';
import { motion } from 'framer-motion';

const InternetPopup = ({ isOpen, onClose, onSubmit }) => {
  const [matricNumber, setMatricNumber] = useState('');
  const [preferredPassword, setPreferredPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (matricNumber.trim() && preferredPassword.trim()) {
      onSubmit({ matricNumber, preferredPassword });
      setMatricNumber('');
      setPreferredPassword('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="internet-popup-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="internet-popup"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="internet-popup-content">
          <div className="internet-popup-header">
            <h3>Internet/Network Complaint</h3>
            <button 
              className="close-btn"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="internet-form">
            <div className="form-group">
              <label>Enter your matric number and your preferred password</label>
            </div>
            
            <div className="form-group">
              <label>Matric Number *</label>
              <input
                type="text"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                placeholder="Enter your matric number"
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Preferred Password *</label>
              <input
                type="password"
                value={preferredPassword}
                onChange={(e) => setPreferredPassword(e.target.value)}
                placeholder="Enter your preferred password"
                required
                className="form-input"
              />
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InternetPopup;
