
import React, { useState } from 'react';
import axios from 'axios';
import { FaTools, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import './DebugTools.css';

const DebugTools = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleResetClick = () => {
    setIsModalOpen(true);
    setMessage({ type: '', text: '' });
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      setIsModalOpen(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // This endpoint needs to be created on the server
      await axios.delete('/api/debug/reset-complaints'); 
      setMessage({ type: 'success', text: 'All complaints have been successfully reset. The page will now reload.' });
      setIsLoading(false);
      setTimeout(() => {
        setIsModalOpen(false);
        window.location.reload(); // Reload to see the changes
      }, 2500);
    } catch (error) {
      console.error('Error resetting complaints:', error);
      setMessage({ type: 'error', text: 'Failed to reset complaints. Check the server logs.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="debug-tools-section">
      <div className="debug-tools-header">
        <FaTools />
        <h3>Developer Debug Tools</h3>
      </div>
      <p>These actions are irreversible and intended for development purposes only.</p>
      <div className="debug-actions">
        <button className="debug-btn reset-btn" onClick={handleResetClick}>
          Reset All Complaints
        </button>
      </div>

      {isModalOpen && (
        <div className="debug-modal-overlay">
          <div className="debug-modal-content">
            <div className="debug-modal-header">
              <FaExclamationTriangle className="warning-icon" />
              <h3>Confirm Action</h3>
            </div>
            <div className="debug-modal-body">
              {!message.text ? (
                <>
                  <p>Are you sure you want to reset all complaints?</p>
                  <p className="warning-text">This will delete all existing complaints from the database and cannot be undone.</p>
                </>
              ) : (
                <p className={`message ${message.type}`}>{message.text}</p>
              )}
            </div>
            <div className="debug-modal-actions">
              {isLoading ? (
                <div className="loading-container">
                  <FaSpinner className="loading-spinner" />
                  <span>Processing...</span>
                </div>
              ) : (
                !message.text && (
                  <>
                    <button onClick={handleCloseModal} className="btn-cancel">Cancel</button>
                    <button onClick={handleConfirmReset} className="btn-confirm-delete">Yes, Reset</button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugTools;
